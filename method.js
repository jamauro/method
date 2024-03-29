import { Meteor } from 'meteor/meteor';
import { check as c, Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';

const config = {
  before: [],
  after: [],
  serverOnly: false,
  options: {
    // Make it possible to get the ID of an inserted item
    returnStubValue: true,

    // Don't call the server method if the client stub throws an error, so that we don't end
    // up doing validations twice
    throwStubExceptions: true,
  },
  open: false,
  loggedOutError: new Meteor.Error('logged-out', 'You must be logged in')
};

const configure = options => {
  c(options, {
    before: Match.Maybe(Match.OneOf([Function], Function)),
    after: Match.Maybe(Match.OneOf([Function], Function)),
    serverOnly: Match.Maybe(Boolean),
    options: Match.Maybe({
      returnStubValue: Match.Maybe(Boolean),
      throwStubExceptions: Match.Maybe(Boolean)
    }),
    open: Match.Maybe(Boolean),
    loggedOutError: Match.Maybe(Match.Where(e => e instanceof Meteor.Error || e instanceof Error))
  });

  return Object.assign(config, options);
};

const hasEasySchema = Package['jam:easy-schema'];
const { check, shape, pick, _getParams } = hasEasySchema ? require('meteor/jam:easy-schema') : { check: c, pick: require('./utils.js').pick };
const schemaSymbol = Symbol('schema');
const serverSymbol = Symbol('serverOnly');
const openSymbol = Symbol('open');
const paramsSymbol = Symbol('params');
const _created = Symbol('_created');
const restrictedNames = ['insert', 'insertAsync', 'update', 'updateAsync', 'remove', 'removeAsync', 'upsert', 'upsertAsync', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];
const noop = () => { };
const names = [];
let methodNum = 0;

/**
 * Creates a higher-order function with an attached schema value.
 *
 * @param {any} schemaValue - The schema value to be attached to the function.
 * @returns {function} - A higher-order function that has the provided schema value attached.
 */
export const schema = schemaValue => fn => {
  if (Meteor.isClient && !fn) {
    fn = noop;
  }
  fn[schemaSymbol] = hasEasySchema && schemaValue?.constructor === Object ? shape(schemaValue) : schemaValue;
  return fn;
};

/**
 * Wraps a function to make it run on the server only.
 *
 * @param {function} fn - The function to be marked as server only.
 * @returns {function} - The marked function that only executes on the server side. On the client, it returns a noop.
 */
export function server(fn) {
  if (Meteor.isServer) {
    fn[serverSymbol] = true;
    return fn;
  } else {
    if (fn) {
      Object.defineProperty(noop, 'name', { value: fn.name });
      Object.getOwnPropertySymbols(fn).map(symbol => noop[symbol] = fn[symbol]);
      noop[paramsSymbol] = _getParams(fn);
    }
    noop[serverSymbol] = true;
    return noop;
  }
}

/**
 * Wraps a function to make it open - aka NOT require a logged-in user.
 *
 * @param {function} fn - The function to be marked as open.
 * @returns {function} - The marked function.
 */
export function open(fn) {
  fn[openSymbol] = true;
  return fn;
}

/**
 * Wraps a function to make it closed - aka require a logged-in user.
 *
 * @param {function} fn - The function to be marked as closed.
 * @returns {function} - The marked function.
 */
export function close(fn) {
  fn[openSymbol] = false;
  return fn;
}

const clearSymbols = fn => Object.getOwnPropertySymbols(fn).forEach(symbol => delete fn[symbol]);

const getMetadata = fn => {
  const metadata = { schema: fn[schemaSymbol], serverOnly: fn[serverSymbol], open: fn[openSymbol], params: fn[paramsSymbol] };
  clearSymbols(fn);

  return metadata;
};

const generateConfig = fn => {
  const { schema, serverOnly, open } = getMetadata(fn);

  return {
    name: fn.name?.length > 1 ? fn.name : schema?.constructor === Object ? `${Object.keys(schema).slice(0, 3).join('_')}-${methodNum + 1}` : `${schema ? schema.name.toLowerCase() : 'method'}-${methodNum + 1}`,
    schema,
    run: fn,
    serverOnly,
    open
  };
};

/**
 * Attaches methods to a Mongo.Collection prototype.
 *
 * @function
 * @memberof Mongo.Collection.prototype
 * @name attachMethods
 * @param {Object.<string, Function>} methods - An object containing method functions to be attached.
 * @param {{
 *  before?: Function | Array<Function>;
 *  after?: Function | Array<Function>;
 *  rateLimit?: { limit: number, interval: number },
 *  open?: boolean,
 *  serverOnly?: boolean,
 *  options?: Object
 * }} [options={}] - Additional options for method attachment.
 */
Mongo.Collection.prototype.attachMethods = function(methods, options = {}) {
  // We're only attaching methods on the client because that's where they should be called from. Technically they can be called frmo the server but it's considered bad practice so this enforces that they won't be available server side on the Collection. If needed, any server side logic should be pulled out into a function that can be called from other server functions.
  try {
    const collection = this;

    for (const [k, v] of Object.entries(methods)) {
      if (restrictedNames.includes(k)) {
        throw new Error(`Cannot have method named "${k}" on ${collection._name} collection`)
      }

      if (v[_created]) {
        if (Meteor.isServer) continue;
        collection[k] = v;
        continue;
      }

      const { schema, serverOnly, open, params = _getParams(v) } = getMetadata(v);

      const method = createMethod({
        name: `${collection._name}.${k}`,
        schema: schema ?? (hasEasySchema ? pick(collection.schema, params) : undefined),
        run: v,
        ...options,
        ...(serverOnly && { serverOnly }),
        ...(open ? { open } : {})
      });

      if (Meteor.isServer) continue;
      collection[k] = method;
    };

    return;
  } catch (error) {
    console.error(error)
  }
};

const setCreated = fn => {
  fn[_created] = true;
  setTimeout(() => clearSymbols(fn), 250);
  return;
};

const getValidator = (schema, run) => {
  let validate;
  let partialSchema; // this is a deep partial, aka deep optional

  if (typeof schema.parse === 'function') {
    validate = data => schema.parse(data)
    partialSchema = schema.partial();
    validate.only = data => partialSchema.parse(data);
    return validate;
  }

  if (typeof schema.validate === 'function') {
    validate = data => (schema.validate(data), data);
    validate.only = data => (schema.pick(Object.keys(data).join(', ')).validate(data), data);
    return validate;
  }

  /** @type {import('meteor/check').Match.Pattern} */
  const schemaToCheck = hasEasySchema && schema.constructor === Object ? (Object.getOwnPropertySymbols(schema)[0] ? (schema['$id'] ? pick(schema, _getParams(run)) : schema) : shape(schema)) : schema;
  validate = data => (check(data, schemaToCheck), data);
  partialSchema = hasEasySchema && shape(schemaToCheck, {optionalize: true});
  validate.only = partialSchema ? data => (check(data, partialSchema), data) : data => (check(data, pick(schema, Object.keys(data))), data);

  return validate;
};

/**
 * Create a method with specified properties or given a function.
 * @template {import('meteor/check').Match.Pattern | import('zod').ZodTypeAny | import('simpl-schema').SimpleSchema} S - The schema type (jam:easy-schema, check, Zod, or simple-schema)
 * @template T - The return type
 * @param {{
 *   name: string,
 *   schema?: S,
 *   validate?: Function,
 *   before?: Function | Array<Function>,
 *   after?: Function | Array<Function>,
 *   run?: (this: Meteor.MethodThisType, args?: z.output<S> | S) => T,
 *   rateLimit?: { limit: number, interval: number },
 *   open?: boolean,
 *   serverOnly?: boolean,
 *   options?: Object
 * } | Function } config - Options for creating the method. Can be a function instead (see functional-style syntax in docs).
 * @returns {(...args?: (z.input<S> | S)[]) => Promise<T> | { pipe: (...fns: Function[]) => (...args?: (z.input<S> | S)[]) => Promise<T> }} - The method function or an object with a `pipe` method
 */
export const createMethod = config => {
  const isFn = typeof config === 'function';
  const { name: n, schema, validate: v, before = [], after = [], run, rateLimit, open, serverOnly, options = {} } = isFn ? generateConfig(config) : config;

  if (!n) {
    throw new Error('You must pass in a name when creating a method')
  }

  function checkSetup() {
    if (!schema && !v || schema && v) {
      throw new Error(`You must pass in either a schema or a validate function${schema && v ? ', not both,' : ''} for method '${n}'`)
    }
  }

  let name = n;
  let pipeline = [];

  if (typeof run === 'function') {
    pipeline = [run];
  }

  const applyOptions = {
    ...Methods.config.options,
    ...options,
    isFromCallAsync: true // mimic callAsync through isFromCallAsync
  };

  const checkLoggedIn = !(open ?? Methods.config.open);
  const validate = schema ? getValidator(schema, run) : v;

  /**
   * @template D
   * @param {D} data - The input data to be validated.
   */
  const method = async function(data) {
    if (pipeline.length === 0) {
      throw new Error(`.pipe or run function for ${name} never configured`);
    }

    const methodInvocation = this;
    let onResult = [];
    let onError = [];

    if (checkLoggedIn && !methodInvocation.userId) {
      throw Methods.config.loggedOutError;
    }

    /**
     * @type {import('zod').output<Z> | S | D}
     */
    const validatedData = schema ? validate(data) : validate ? (await validate(data), data) : data;

    const context = {
      originalInput: validatedData,
      type: 'method',
      name,
      onResult(callback) {
        onResult.push(callback);
      },
      onError(callback) {
        onError.push(callback);
      }
    }

    async function execute() {
      const { before: beforeAll = [], after: afterAll = [] } = Methods.config;
      const beforePipeline = [...(Array.isArray(beforeAll) ? beforeAll : [beforeAll]), ...(Array.isArray(before) ? before : [before])];
      const afterPipeline = [...(Array.isArray(after) ? after : [after]), ...(Array.isArray(afterAll) ? afterAll : [afterAll])];

      const fullPipeline = [
        ...beforePipeline,
        ...pipeline,
        ...afterPipeline
      ];

      let input = validatedData;
      let runResult;

      for (const func of fullPipeline) {
        const result = await func.call(methodInvocation, input, context);
        if (func === run) {
          runResult = result
        }
        input = (run ? (beforePipeline.includes(func) ? input : afterPipeline.includes(func) ? runResult : result) : result) || input; // if you return nothing from one of the steps in the pipeline, it will continue with the previous input
      }

      return input;
    }

    try {
      let result = await execute();

      onResult.forEach(callback => { // this allows you to get the final result of the pipeline and do things with it (See log function)
        callback(result);
      });

      return result;
    } catch (error) {
      error = onError.reduce((err, callback) => {
        return callback(err) ?? err;
      }, error);

      throw error;
    }
  };

  // register the method with Meteor internals
  if (isFn) methodNum++;
  if (Meteor.isServer) {
    if (isFn) {
      names.push({ id: methodNum, name });
    }

    Meteor.methods({
      [name]: method,
      ...(isFn && !Meteor.server.method_handlers['_getFnName'] && {
        _getFnName(num) {
          return names.find(n => n.id === num);
        }
      }),
    });
  }

  if (Meteor.isClient) {
    const register = (name, method) => {
      if (serverOnly ?? Methods.config.serverOnly) return;
      return Meteor.methods({ [name]: method });
    };

    if (!isFn) {
      register(name, method);
    } else {
      Meteor.callAsync('_getFnName', methodNum).then(result => {
        name = result.name;
        register(name, method);
      });
    }
  }

  if (rateLimit && Meteor.isServer) {
    const DDPRateLimiter = require('meteor/ddp-rate-limiter').DDPRateLimiter;

    DDPRateLimiter.addRule({
      type: 'method',
      name,
      clientAddress() { return true },
      connectionId() { return true },
      userId() { return true },
    }, rateLimit.limit, rateLimit.interval);
  }

  /**
   * @param {...(z.input<S> | S)[]} args - Arguments for the method
   * @returns {Promise<T>} - Result of the method
   */
  function call(...args) {
    if (Meteor.isClient) {
      return new Promise((resolve, reject) => {
        const stub = Meteor.applyAsync(name, args, applyOptions, (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        });

        // catch exceptions on the stub and re-route them to the promise wrapper
        if (applyOptions.throwStubExceptions) {
          const isThenable = stub && typeof stub.then === 'function';
          if (isThenable) stub.catch(error => reject(error));
        }
      });
    }

    return Meteor.applyAsync(name, args, applyOptions);
  }

  /**
   * Validate without executing the method.
   * @template D
   * @param {D} data - The input data to be validated.
   * @returns {import('zod').output<Z> | D}
   */
  call.validate = data => validate(data);

  /**
   * Validate only a subset without executing the method.
   * @template D
   * @param {D} data - The input data to be validated.
   * @returns {import('zod').output<Z> | D}
   */
  call.validate.only = data => validate.only(data);

  setCreated(call);

  if (run) {
    if (run.length !== 0) checkSetup();
    return call;
  }

  return {
    pipe(..._pipeline) {
      if (_pipeline.some(p => p.length !== 0)) checkSetup();
      pipeline = _pipeline
      return call;
    }
  };
};

export const Methods = Object.freeze({
  config,
  configure,
  create: createMethod
});
