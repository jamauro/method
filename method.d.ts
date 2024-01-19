import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { ZodTypeAny } from 'zod';
import SimpleSchema from 'simpl-schema';

export declare const createMethod: <S extends Match.Pattern | ZodTypeAny | SimpleSchema, T>(
  config: {
    name: string,
    schema?: S,
    validate?: Function,
    before?: Function | Array<Function>,
    after?: Function | Array<Function>,
    run?: (this: Meteor.MethodThisType, args?: z.output<S> | S) => T,
    rateLimit?: { limit: number, interval: number },
    open?: boolean,
    serverOnly?: boolean,
    options?: Object
  } | Function
) => ((...args?: (z.input<S> | S)[]) => Promise<T> | { pipe: (...fns: Function[]) => (...args?: (z.input<S> | S)[]) => Promise<T> });

type Methods = {
  config: {
    before?: Function | Function[];
    after?: Function | Function[];
    serverOnly?: boolean;
    options?: {
      returnStubValue?: boolean;
      throwStubExceptions?: boolean;
    };
    open?: boolean;
    loggedOutError?: Error | Meteor.Error;
  };
  configure: (options: {
    before?: Function | Function[];
    after?: Function | Function[];
    serverOnly?: boolean;
    options?: {
      returnStubValue?: boolean;
      throwStubExceptions?: boolean;
    };
    open?: boolean;
    loggedOutError?: Error | Meteor.Error;
  }) => any;
  create: <S extends Match.Pattern | ZodTypeAny | SimpleSchema, T>(
    config: {
      name: string,
      schema?: S,
      validate?: Function,
      before?: Function | Array<Function>,
      after?: Function | Array<Function>,
      run?: (this: Meteor.MethodThisType, args?: z.output<S> | S) => T,
      rateLimit?: { limit: number, interval: number },
      open?: boolean,
      serverOnly?: boolean,
      options?: Object
    } | Function
  ) => ((...args?: (z.input<S> | S)[]) => Promise<T> | { pipe: (...fns: Function[]) => (...args?: (z.input<S> | S)[]) => Promise<T> })
};

export declare const Methods: Methods;

/**
 * Creates a higher-order function with an attached schema value.
 *
 * @param schemaValue - The schema value to be attached to the function.
 * @returns A higher-order function that has the provided schema value attached.
 */
export declare const schema: <T>(schemaValue: T) => (fn: Function) => Function;

/**
 * Wraps a function to make it run on the server only.
 *
 * @param {function} fn - The function to be marked as server only.
 * @returns {function} - The marked function that only executes on the server side. On the client, it returns a noop.
 */
export function server(fn: () => void): () => void;

/**
 * Wraps a function to make it open - aka NOT require a logged-in user.
 *
 * @param {function} fn - The function to be marked as open.
 * @returns {function} - The marked function.
 */
export declare function open(fn: Function): Function;

/**
 * Wraps a function to make it closed - aka require a logged-in user.
 *
 * @param {function} fn - The function to be marked as closed.
 * @returns {function} - The marked function.
 */
export declare function close(fn: Function): Function;

declare module 'meteor/mongo' {
  module Mongo {
    interface Collection {
      attachMethods(
        methods: { [methodName: string]: Function },
        options?: {
          before?: Function | Array<Function>;
          after?: Function | Array<Function>;
          rateLimit?: { limit: number; interval: number };
          open?: boolean;
          serverOnly?: boolean;
          options?: object;
        }
      ): void;
    }
  }
}
