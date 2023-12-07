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
  arePublic: false,
  basePath: `/imports/api`,
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
    arePublic: Match.Maybe(Boolean),
    basePath: Match.Maybe(String),
    loggedOutError: Match.Maybe(Match.Where(e => e instanceof Meteor.Error || e instanceof Error))
  });

  return Object.assign(config, options);
};

const restrictedNames = ['insert', 'insertAsync', 'update', 'updateAsync', 'remove', 'removeAsync', 'upsert', 'upsertAsync', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];

Mongo.Collection.prototype.attachMethods = async function(methods = undefined) {
  // Attaching methods to the collection
  // Methods can't have names insert, update, or remove because they'll interfere with the one's that Meteor autogenerates for each Collection. Kind of unfortunate.
  // We're only attaching methods on the client because that's where they should be called from. Technically they can be called frmo the server but it's considered bad practice so this enforces that they won't be available server side on the Collection. If needed, any server side logic should be pulled out into a function that can be called from other server functions.
  if (Meteor.isServer) {
    return;
  }

  const methodsToAttach = methods ? methods : await import(`${config.basePath}/${this._name}/methods`);
  if (!methodsToAttach) {
    throw new Error('No methods found to attach');
  }

  const matchedRestrictedNames = Object.keys(methodsToAttach).filter(key => restrictedNames.includes(key));
  if (matchedRestrictedNames.length) {
    throw new Error(`Cannot have methods named "${matchedRestrictedNames.join(', ')}" on ${this._name} collection`)
  }

  for (key in methodsToAttach) {
    this[key] = methodsToAttach[key]
  }

  return;
};

const check = Package['jam:easy-schema'] ? require('meteor/jam:easy-schema').check : c;

const getValidator = schema => {
  if (typeof schema.parse === 'function') {
    return data => schema.parse(data)
  }

  if (typeof schema.validate === 'function') {
    return data => (schema.validate(data), data)
  }

  return data => (check(data, schema), data);
};

/**
 * Create a method with specified properties.
 * @template {import('zod').ZodTypeAny} S - The Zod schema type
 * @param {{
 *   name: string,
 *   schema?: S | Object | any,
 *   validate?: Function,
 *   before?: Function|Array<Function>,
 *   after?: Function|Array<Function>,
 *   run?: Function,
 *   rateLimit?: { limit: number, interval: number },
 *   isPublic?: boolean,
 *   serverOnly?: boolean,
 *   options?: Object
 * }} config - Options for creating the method.
 * @returns {Function | { pipe: Function }} - The method function or an object with a `pipe` method
 */
export const createMethod = ({ name, schema = undefined, validate: v = undefined, before = [], after = [], run = undefined, rateLimit = undefined, isPublic = undefined, serverOnly = undefined, options = {} }) => {
  if (!name) {
    throw new Error('You must pass in a name when creating a method')
  }
  if (!schema && !v || schema && v) {
    throw new Error(`You must pass in either a schema or a validate function${schema && v ? ', not both,' : ''} for method '${name}'`)
  }

  let pipeline = [];

  if (typeof run === 'function') {
    pipeline = [run];
  }

  const applyOptions = {
    ...Methods.config.options,
    ...options,
    isFromCallAsync: true // mimic callAsync through isFromCallAsync
  };

  const checkLoggedIn = !(isPublic ?? Methods.config.arePublic);
  const validate = schema ? getValidator(schema) : v;

  /**
   * @template T
   * @param {T} data - The input data to be validated.
   */
  const method = async function(data) {
    if (pipeline.length === 0) {
      throw new Error(`.pipe or run function for ${name} never configured`);
    }

    const methodInvocation = this;
    let onResult = [];
    let onError = [];

    /**
     * @type {import('zod').output<S> | T}
     */
    const validatedData = schema ? validate(data) : (validate(data), data);

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
      if (checkLoggedIn && !methodInvocation.userId) {
        throw Methods.config.loggedOutError;
      }

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

  if (serverOnly ?? Methods.config.serverOnly) {
    if (Meteor.isServer) {
      Meteor.methods({
        [name]: method
      });
    }
  } else {
    Meteor.methods({
      [name]: method
    });
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
          if (isThenable) stub.catch(err => reject(err));
        }
      });
    }

    return Meteor.applyAsync(name, args, applyOptions);
  }

  if (run) {
    return call;
  }

  return {
    pipe(..._pipeline) {
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
