import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { createMethod, Methods } from 'meteor/jam:method'; // Method
import { Any } from 'meteor/jam:easy-schema';
import assert from 'assert';

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const sleep = async ms => {
  await wait(ms)
  return 20
}

export const defaultAuthed = createMethod({
  name: 'defaultAuthed',
  schema: Any,
  run() {
    return 5;
  }
});

export const customValidate = createMethod({
  name: 'customValidate',
  isPublic: true,
  validate(args) {
    check(args, {num: Number})
  },
  run({num}) {
    return num;
  }
});

export const test1 = createMethod({
  name: 'test1',
  schema: Any,
  isPublic: true,
  run() {
    return 5;
  }
});

export const testAsync = createMethod({
  name: 'testAsync',
  schema: {num: Number},
  isPublic: true,
  async run({num}) {
    if (Meteor.isServer) {
      await wait(200)
    }

    return num * 10;
  }
});

export const asyncMethod = createMethod({
  name: 'asyncMethod',
  schema: {num: Number},
  isPublic: true,
  async run({ num }) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(['result', 'result2', num]);
      }, 500);
    })
    .then(result => {
      return result.join(',');
    });
  }
});

export const errorMethod = createMethod({
  name: 'errorMethod',
  schema: Any,
  isPublic: true,
  run() {
    throw new Error('test error');
  }
});

export const methodUnblock = createMethod({
  name: 'methodUnblock',
  schema: Number,
  isPublic: true,
  run() {
    this.unblock();

    if (Meteor.isServer) {
      new Promise(resolve => setTimeout(resolve, 500))
      return 10;
    }
  }
})

export const schema = Any;
export function run() { };

export const configMethod = createMethod({
  name: 'a',
  schema,
  run
});

export const rateLimited = createMethod({
  name: 'rateLimited',
  schema: Any,
  isPublic: true,
  rateLimit: {
    interval: 5000,
    limit: 5
  },
  run() {
    return true;
  }
});

export const wait100 = createMethod({
  name: 'wait100',
  schema: Any,
  isPublic: true,
  async run() {
    await wait(100);
    return true;
  }
});

export const fastMethod = createMethod({
  name: 'fast',
  schema: Any,
  isPublic: true,
  async run() {
    return 5;
  }
});

export const simplePipeline = createMethod({
  name: 'simplePipeline',
  schema: Number,
  isPublic: true,
}).pipe(
    (n) => n + 5,
    (n) => n - 1,
    (n) => n + 0.5
);

export const asyncPipeline = createMethod({
  name: 'asyncPipeline',
  schema: Number,
  isPublic: true,
}).pipe(
  async (n) => n + 5,
  (n) => Promise.resolve(n - 1),
  async (n) => n + 0.5
);

/* const partial = partialPipeline(
  (i) => i + 10,
  (i) => i / 2
);

const partial2 = partialPipeline(partial);

export const partialMethod = createMethod({
  name: 'partial',
  schema: z.number()
}).pipeline(
  partial2,
  (i) => i.toFixed(1)
); */

export const contextMethod = createMethod({
  name: 'context',
  schema: Number,
  isPublic: true,
}).pipe(
  (input, context) => {
    resetEvents();
    return true
  },
  (input, context) => {
    assert.equal(input, true);
    assert.equal(typeof context.originalInput, 'number');
    assert.equal(context.type, 'method');
    assert.equal(context.name, 'context');

    context.onResult(r => {
      events.push(`result: ${r}`);
    });

    return input;
  }
);

export const contextFailedMethod = createMethod({
  name: 'contextFailedMethod',
  schema: Number,
  isPublic: true,
}).pipe(
  (input, context) => {
    resetEvents();
    context.onError(err => {
      events.push(err.message);
    });
    context.onError(err => {
      events.push(err.message);
      throw new Meteor.Error('second err');
    });
    context.onResult(() => {
      events.push('result');
    });
  },
  () => {
    throw new Error('first err');
  }
);

const globalPipeline = createMethod({
  name: 'globalPipeline',
  schema: Number,
  isPublic: true,
  run(input) {
    return input;
  }
});

export const globalBefore = async (input) => {
  const inc = (input, context) => input = input + 1
  Methods.configure({
    before: inc
  });

  return globalPipeline(input)
}

export const globalAfter = async (input) => {
  const dec = (input, context) => input = input - 1
  Methods.configure({
    after: dec
  });

  return globalPipeline(input)
}


// Used for publication tests

export const Numbers = new Mongo.Collection('numbers');
export const Selected = new Mongo.Collection('selected');

if (Meteor.isServer) {
  Numbers.remove({});
  Selected.remove({});

  for(let i = 0; i < 100; i++) {
    Numbers.insert({ num: i });
  }
}

let events = [];

export function recordEvent(text) {
  events.push(text);
}

export function resetEvents() {
  events = [];
}

export const getEvents = createMethod({
  name: 'getEvents',
  schema: Any,
  isPublic: true,
  run() {
    return events;
  }
});

export const setOptions = (num) => {
  Methods.configure({
    options: {
      ...Methods.config.options,
      returnStubValue: false
    }
  });

  const addSelected = createMethod({
    name: 'selected.insert',
    schema: Number,
    isPublic: true,
    run(num) {
      const selectedId = Selected.insert({
        _id: num.toString(),
        num
      });

      return selectedId
    }
  });
}

export const addSelected = createMethod({
  name: 'addSelected',
  schema: {num: Number},
  isPublic: true,
  run({num}) {
    const _id = '123'
    const selectedId = Selected.insert({
      _id,
      num
    });

    return selectedId
  }
});

export const addSelectedAsync = createMethod({
  name: 'addSelectedAsync',
  schema: {num: Number},
  isPublic: true,
  async run({num}) {
    const _id = (num * 2).toString();

    const selectedId = await Selected.insertAsync({
      _id,
      num
    });

    return selectedId
  }
});

export const rollBackAsync = createMethod({
  name: 'rollBackAsync',
  schema: {num: Number},
  isPublic: true,
  async run({num}) {
    const _id = (num * 2).toString();

    if (Meteor.isServer) {
      throw new Error('server error')
    }

    const selectedId = await Selected.insertAsync({
      _id,
      num
    });

    return selectedId
  }
});

export const removeSelected = createMethod({
  name: 'removeSelected',
  schema: String,
  isPublic: true,
  async run(id) {
    return Selected.removeAsync({
      _id: id
    });
  }
});

export const updateSelected = createMethod({
  name: 'updateSelected',
  schema: { id: String, num: Number },
  isPublic: true,
  run({ id, num }) {
    return Selected.update(
      { _id: id },
      { $set: { num } }
    );
  }
});
