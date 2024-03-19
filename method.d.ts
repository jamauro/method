import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import type * as z from 'zod';
import SimpleSchema from 'simpl-schema';

export interface PipelineContext<T> {
  originalInput: T,
  type: 'method',
  name: string | null;
  onError: (err: any) => any;
  onResult: (result: any) => void;
  stop: () => void;
}

export interface CreateMethodPipeline<I, This = Meteor.MethodThisType> {
  <R1>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1): (...args: I extends undefined ? [] : [I]) => Promise<R1>;
  <R1, R2>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2,): (...args: I extends undefined ? [] : [I]) => Promise<R2>;
  <R1, R2, R3>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3): (...args: I extends undefined ? [] : [I]) => Promise<R3>;
  <R1, R2, R3, R4>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3, fn4: (this: This, input: Awaited<R3>, context: PipelineContext<I>) => R4): (...args: I extends undefined ? [] : [I]) => Promise<R4>;
  <R1, R2, R3, R4, R5>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3, fn4: (this: This, input: Awaited<R3>, context: PipelineContext<I>) => R4, fn5: (this: This, input: Awaited<R4>, context: PipelineContext<I>) => R5): (...args: I extends undefined ? [] : [I]) => Promise<R5>;
  <R1, R2, R3, R4, R5, R6>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3, fn4: (this: This, input: Awaited<R3>, context: PipelineContext<I>) => R4, fn5: (this: This, input: Awaited<R4>, context: PipelineContext<I>) => R5, fn6: (this: This, input: Awaited<R5>, context: PipelineContext<I>) => R6): (...args: I extends undefined ? [] : [I]) => Promise<R6>;
  <R1, R2, R3, R4, R5, R6, R7>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3, fn4: (this: This, input: Awaited<R3>, context: PipelineContext<I>) => R4, fn5: (this: This, input: Awaited<R4>, context: PipelineContext<I>) => R5, fn6: (this: This, input: Awaited<R5>, context: PipelineContext<I>) => R6, fn7: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R7): (...args: I extends undefined ? [] : [I]) => Promise<R7>;
  <R1, R2, R3, R4, R5, R6, R7, R8>(fn1: (this: This, input: I, context: PipelineContext<I>) => R1, fn2: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R2, fn3: (this: This, input: Awaited<R2>, context: PipelineContext<I>) => R3, fn4: (this: This, input: Awaited<R3>, context: PipelineContext<I>) => R4, fn5: (this: This, input: Awaited<R4>, context: PipelineContext<I>) => R5, fn6: (this: This, input: Awaited<R5>, context: PipelineContext<I>) => R6, fn7: (this: This, input: Awaited<R1>, context: PipelineContext<I>) => R7, fn8: (this: This, input: Awaited<R7>, context: PipelineContext<I>) => R8): (...args: I extends undefined ? [] : [I]) => Promise<R8>;
}

export declare function validate<D, Z extends z.ZodTypeAny>(data: D): z.output<Z> | D;

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
export declare const createMethod: {
  validate: typeof validate;
  validate: {
    only: typeof validate;
  };

  <S extends z.ZodTypeAny, T>(
    config: {
      name: string,
      schema: S,
      rateLimit?: { interval: number; limit: number },
      validate?: Function,
      before?: Function | Array<Function>,
      after?: Function | Array<Function>,
      open?: boolean,
      serverOnly?: boolean,
      options?: Object,
      run: (this: Meteor.MethodThisType, args: z.output<S>) => T
    }
  ): (...args: S extends z.ZodUndefined ? [] : [z.input<S>]) => Promise<T>;

  <S extends Match.Pattern | SimpleSchema, T>(
    config: {
      name: string,
      schema?: S,
      validate?: Function,
      rateLimit?: { interval: number; limit: number },
      before?: Function | Array<Function>,
      after?: Function | Array<Function>,
      open?: boolean,
      serverOnly?: boolean,
      options?: Object,
      run: (this: Meteor.MethodThisType, args?: any) => T
    }
  ): (...args?: any) => Promise<T>;

  <S extends z.ZodTypeAny>(
    config: {
      name: string,
      schema: S,
      rateLimit?: { interval: number; limit: number },
      before?: Function | Array<Function>,
      after?: Function | Array<Function>,
      open?: boolean,
      serverOnly?: boolean,
      options?: Object,
    }
  ): { pipe: CreateMethodPipeline<z.output<S>> };

  <S extends Match.Pattern | SimpleSchema>(
    config: {
      name: string,
      schema?: S,
      validate?: Function,
      rateLimit?: { interval: number; limit: number },
      before?: Function | Array<Function>,
      after?: Function | Array<Function>,
      open?: boolean,
      serverOnly?: boolean,
      options?: Object,
    }
  ): { pipe: CreateMethodPipeline<any> };

  <T>(method: T): (...args?: any) => Promise<T>;
};

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
  create: typeof createMethod
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
