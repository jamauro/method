# Method

Method is an easy way to create Meteor `methods` with Optimistic UI. It's built with Meteor 3.0 in mind. It's meant to be a drop in replacement for [Validated Method](https://github.com/meteor/validated-method) and comes with additional features:

* Before and after hooks
* Global before and after hooks for all methods
* Pipe a series of functions
* Authed by default (can be overriden)
* Easily configure a rate limit
* Optionally run a method on the server only
* Attach the methods to Collections (optional)
* Validate with a [jam:easy-schema](https://github.com/jamauro/easy-schema) schema or a custom validation function
* No need to use `.call` to invoke the method as with `Validated Methods`

## Usage

### Add the package to your app
`meteor add jam:method`

### Create a method
`name` is required and will be how Meteor's internals identifies it.

`schema` will automatically validate a [jam:easy-schema](https://github.com/jamauro/easy-schema) schema.

`run` will be executed when the method is called.

```js
import { createMethod } from 'meteor/jam:method'; // can import { Methods } from 'meteor/jam:method' instead and use Methods.create if you prefer

export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema, // only jam:easy-schema schemas are supported at this time
  run({ text }) {
    const todo = {
      text,
      done: false,
      createdAt: new Date(),
      authorId: Meteor.userId(), // can also use this.userId instead of Meteor.userId()
    }
    const todoId = Todos.insert(todo);
    return todoId;
  }
});
```

You can use a custom validation function instead if you'd like:
```js
// import your schema from somewhere
// import your validator function from somewhere

export const create = createMethod({
  name: 'todos.create',
  validate(args) {
    validator(args, schema)
  },
  run({ text }) {
    const todo = {
      text,
      done: false,
      createdAt: new Date(),
      authorId: Meteor.userId() // can also use this.userId instead of Meteor.userId()
    }
    const todoId = Todos.insert(todo);
    return todoId;
  }
});
```

### Async support
It also supports using `*Async` Collection methods, e.g.:
```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema, // only jam:easy-schema schemas are supported at this time
  async run({ text }) {
    const todo = {
      text,
      done: false,
      createdAt: new Date(),
      authorId: Meteor.userId() // can also use this.userId instead of Meteor.userId()
    }
    const todoId = await Todos.insertAsync(todo);
    return todoId;
  }
});
```

### Import on the client and use
```js
import { create } from '/imports/api/todos/methods';

async function submit() {
  try {
    await create({text: 'book flight to Hawaii'})
  } catch(error) {
    alert(error)
  }
}
```

### Before and after hooks
You can execute functions `before` and / or `after` the method's `run` function. `before` and `after` accept a single function or an array of functions.

When using `before`, the original input passed into the method will be available. The original input will be returned automatically from a `before` function so that `run` receives what was originally passed into the method.

A great use case for using `before` is to verify the user has permission. For example:

```js
async function checkOwnership({ _id }) { // the original input passed into the method is available here. destructuring for _id since that's all we need for this function
  const todo = await Todos.findOneAsync(_id);
  if (todo.authorId !== Meteor.userId()) {
    throw new Meteor.Error('not-authorized')
  }

  return true; // any code executed as a before function will automatically return the original input passed into the method so that they are available in the run function
}

export const markDone = createMethod({
  name: 'todos.markDone',
  schema: Todos.schema,
  before: checkOwnership,
  async run({ _id, done }) {
    return await Todos.updateAsync(_id, {$set: {done}});
  }
});
```

When using `after`, the result of the `run` function will be available as the first argument and the second argument will contain the original input that was passed into the method. The result of the `run` function will be automatically returned from an `after` function.

```js
function exampleAfter(result, context) {
  const { originalInput } = context; // the name of the method is also available here
  // do stuff

  return 'success'; // any code executed as an after function will automatically return the result of the run function
}

export const markDone = createMethod({
  name: 'todos.markDone',
  schema: Todos.schema,
  before: checkOwnership,
  async run({ _id, done }) {
    return await Todos.updateAsync(_id, {$set: {done}});
  },
  after: exampleAfter
});
```

**`Note`**: If you use arrow functions for `before`, `run`, or `after`, you'll lose access to `this` – the methodInvocation. You may be willing to sacrifice that because `this.userId` can be replaced by `Meteor.userId()` and `this.isSimulation` can be replaced by `Meteor.isClient` but it's worth noting.


### Pipe a series of functions
Instead of using `run`, you can compose functions using `.pipe`. Each function's output will be available as an input for the next function.

```js
// you'd define the functions in the pipe and then place them in the order you'd like them to execute within .pipe
// be sure that each function in the pipe returns what the next one expects, otherwise you can add an arrow function to the pipe to massage the data, e.g. (input) => manipulate(input)

export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema
}).pipe(
  checkOwnership,
  createTodo,
  sendNotification
)
```

### Attach methods to its Collection (optional)
Instead of importing each method, you can attach them to the Collection. If you're using [jam:easy-schema](https://github.com/jamauro/easy-schema) be sure to attach the schema before attaching the methods.

```js
// /imports/api/todos/collection
import { Mongo } from 'meteor/mongo';
import { schema } from './schema';

export const Todos = new Mongo.Collection('todos');

Todos.attachSchema(schema); // if you're using jam:easy-schema
const methods = require('./methods.js');
Todos.attachMethods(methods);
```

With the methods attached you'll use them like this on the client:
```js
import { Todos } from '/imports/api/todos/collection';
// no need to import each method individually

async function submit() {
  try {
    await Todos.create({text: 'book flight to Hawaii'})
  } catch(error) {
    alert(error)
  }
}
```

#### Dynamically import attached methods (optional)
You can also dynamically import your attached methods to reduce the initial bundle size on the client.

You'll need to add a file to your project, e.g. `/imports/register-dynamic-imports.js` and import this file on both the client and the server near the top of its `mainModule`, e.g. `/client/main.js` and `/server/main.js`. Here's an example of the file:

```js
// In order for the dynamic import to work properly, Meteor needs to know these paths exist.
// We do that by declaring them statically inside a if (false) block
Meteor.startup(async () => {
  if (false) {
    await import('/imports/api/todos/schema'); // if using jam:easy-schema and want to dyanmically import it
    await import('/imports/api/todos/methods');
    // add additional method paths for your other collections here
  }
});
```

Then instead of using `Todos.attachMethods(methods)`, you'd just use `Todos.attachMethods()`
```js
// /imports/api/todos/collection
// By not passing in the methods explicitly, it will automatically dynamically import the methods and then attach them

import { Mongo } from 'meteor/mongo';

export const Todos = new Mongo.Collection('todos');

Todos.attachSchema(); // assuming you're using jam:easy-schema and dynamically importing it too
Todos.attachMethods();
```

This assumes your directory structure is `/imports/api/{collection}/methods`. If you have a different structure, e.g. `/api/todos/methods`, you can configure the base path with:
```js
import { Methods } from 'meteor/jam:method';

Methods.configure({
  basePath: `/api`
});
```

### Execute on the server only
By default, methods are optimistic meaning they will execute on the client and then on the server. You can force a method to execute on the server only by setting `serverOnly: true`. It can be used with `run` or `.pipe`. Here's an example with `run`:

```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema,
  serverOnly: true,
  async run(args) {
    // the code here will execute only on the server
  }
});
```

#### Security note
**`Important`**: Since Meteor does not currently support tree shaking, the code inside `run` function or `.pipe` would still be shipped to the client. If you want to prevent this, you have a couple of options:

1. Import function(s) from a file within a `/server` folder. Any code imported from a `/server` folder will not be shipped to the client. The `/server` folder can be located anywhere within your project's file structure and you can have multiple `/server` folders. For example, you can co-locate with your collection folder, e.g. /imports/api/todos/server/, or it can be at the root of your project. See [secret code](https://guide.meteor.com/security.html#secret-code) for more info.

```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema,
  serverOnly: true,
  async run(args) {
    import { serverFunction } from '/server/serverFunction';

    serverFunction(args);
  }
});
```

2. Dynamically import function(s). These do not have to be inside a `/server` folder. This will also prevent the code from being shipped to the client and being inspectable via the browser console. Having said that, if you have some really secret code, #1 is recommended.

```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema,
  serverOnly: true,
  async run(args) {
    const { serviceFunction } = await import('./services');

    serviceFunction(args);
  }
});
```


### Changing authentication rules
By default, all methods will be protected by authentication, meaning they will throw an error if there is *not* a logged-in user. You can change this for an individual method by setting `isPublic: true`. See [Configuring](#configuring-optional) below to change it for all methods.

```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema,
  isPublic: true,
  async run({ text }) {
    // ... //
  }
});
```

### Rate limiting
Easily rate limit a method by setting its max number of requests – the `limit` – within a given time period (milliseconds) – the `interval`.

```js
export const create = createMethod({
  name: 'todos.create',
  schema: Todos.schema,
  rateLimit: { // rate limit to a max of 5 requests every second
    limit: 5,
    interval: 1000
  },
  async run({ text }) {
    // ... //
  }
});
```

## Configuring (optional)
If you like the defaults, then you won't need to configure anything. But there is some flexibility in how you use this package.

Here are the defaults:
```js
const config = {
  before: [], // global before function(s) that will run before all methods
  after: [], // global after function(s) that will run after all methods
  options: {
    returnStubValue: true, // make it possible to get the ID of an inserted item on the client before the server finishes
    throwStubExceptions: true,  // don't call the server method if the client stub throws an error, so that we don't end up doing validations twice
  },
  arePublic: false, // by default all methods will be protected by authentication, override it for all methods by setting this to true
  basePath: `/imports/api`, // used when dynamically importing methods
};
````

To change the defaults, use:
```js
// can be configured on client-side and server-side (in a file imported on both client and server)
// or just server-side depending on your use case
import { Methods } from 'meteor/jam:method';

Methods.configure({
  // ... change the defaults here ... //
});
```

### Global before and after hooks
You can create before and/or after functions to run before / after all methods. Both `before` and `after` accept a single function or an array of functions.

```js
import { Methods } from 'meteor/jam:method';

const hello = () => { console.log('hello') }
const there = () => { console.log('there') }
const world = () => { console.log('world') }

Methods.configure({
  before: [hello, there],
  after: world
});
```

### Helpful utility functions
Here are some helpful utility functions you might consider adding. They aren't included in this package but you can copy and paste them into your codebase where you see fit.

*Logger*
```js
// log will simply console.log or console.error when the Method finishes
function log(input, pipeline) {
  pipeline.onResult((result) => {
    console.log(`Method ${pipeline.name} finished`, input);
    console.log('Result', result);
  });

  pipeline.onError((err) => {
    console.error(`Method ${pipeline.name} failed`);
    console.error('Error', err);
  });
};
```

*Server-only function*
```js
// this will ensure that the function passed in will only run on the server
// could come in handy if have you're using .pipe and some of the functions you want to ensure only run on the server
function server(fn) {
  return function(...args) {
    if (Meteor.isServer) {
      return fn(...args)
    }
  }
};
```

Then you could use them like this:
```js
Methods.configure({
  after: server(log)
});
```

## Coming from `Validated Method`?
You may be familiar with `mixins` and wondering where they are. With the features of this package - authenticated by default, `before` / `after` hooks, `.pipe` - your mixin code may no longer be needed or can be simplified. If you have another use case where your mixin doesn't translate, I'd love to hear it. Open a new discussion and let's chat.
