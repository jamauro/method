import { Meteor } from 'meteor/meteor';
import { check as c, Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

const config = {
  before: [],
  after: [],
  options: {
    // Make it possible to get the ID of an inserted item
    returnStubValue: true,

    // Don't call the server method if the client stub throws an error, so that we don't end
    // up doing validations twice
    throwStubExceptions: true,
  },
  arePublic: false,
  basePath: `/imports/api`,
};

const configure = options => {
  c(options, {
    before: Match.Maybe(Match.OneOf([Function], Function)),
    after: Match.Maybe(Match.OneOf([Function], Function)),
    options: Match.Maybe({
      returnStubValue: Match.Maybe(Boolean),
      throwStubExceptions: Match.Maybe(Boolean)
    }),
    arePublic: Match.Maybe(Boolean),
    basePath: Match.Maybe(String)
  });

  return Object.assign(config, options);
};

const restrictedNames = ['insert', 'insertAsync', 'update', 'updateAsync', 'remove', 'removeAsync', 'upsert', 'upsertAsync', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'];

Mongo.Collection.prototype.attachMethods = async function (methods = undefined) {
  // Attaching methods to the collection
  // Methods can't have names insert, update, or remove because they'll interfere with the one's that Meteor autogenerates for each Collection. Kind of unfortunate.
  // We're only attaching methods on the client because that's where they should be called from. Technically they can be called frmo the server but it's considered bad practice so this enforces that they won't be available server side on the Collection. If needed, any server side logic should be pulled out into a function that can be called from other server functions.
  try {
    if (Meteor.isServer) {
      return;
    }

    const methodsToAttach = methods ? methods : await import(`${config.basePath}/${this._name}/methods`);
    if (!methodsToAttach) {
      throw new Error('No methods found');
    }

    const matchedRestrictedNames = Object.keys(methodsToAttach).filter(key => restrictedNames.includes(key));
    if (matchedRestrictedNames.length) {
      throw new Error(`Cannot have methods named "${matchedRestrictedNames.join(', ')}" on ${this._name} collection`)
    }

    for (key in methodsToAttach) {
      this[key] = methodsToAttach[key]
    }
  } catch (error) {
    console.error(error)
  }
};

const check = Package['jam:easy-schema'] ? require('meteor/jam:easy-schema').check : undefined;

export const createMethod = ({ name, schema = undefined, validate = undefined, run = undefined, rateLimit = undefined, isPublic = false, options = {} }) => {
  let pipeline = [];

  if (typeof run === 'function') {
    pipeline = [run];
  }

  const applyOptions = {
    ...Methods.config.options,
    ...options
  };

  const checkLoggedIn = isPublic ? false : !Methods.config.arePublic;

  Meteor.methods({
    [name]: async function(data) {
      if (pipeline.length === 0) {
        throw new Error(`Pipeline or run function for ${name} never configured`);
      }

      const methodInvocation = this;
      let onResult = [];
      let onError = [];

      if (!schema && !validate) {
        throw new Error(`You must pass in a schema or a validate function for ${name}`)
      }

      if (schema) {
        if (!check) {
          throw new Error(`You must add the jam:easy-schema package to use a schema`)
        }

        check(data, schema);
      } else {
        validate(data); // allow for a custom validate function
      }


      const context = {
        originalInput: data,
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
          throw new Error('Not logged in')
        }

        const { before = [], after = [] } = Methods.config;

        let input = data;
        const fullPipeline = [
          ...(Array.isArray(before) ? before : [before]),
          ...pipeline,
          ...(Array.isArray(after) ? after : [after])
        ];

        for (const func of fullPipeline) {
          input = await func.call(methodInvocation, input, context) || input; // if you return nothing from one of the steps in the pipeline, it will continue with the previous input
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
    }
  });

  if (rateLimit) {
    DDPRateLimiter?.addRule({
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
        Meteor.applyAsync(name, args, applyOptions, (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        });
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