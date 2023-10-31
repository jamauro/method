// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";
import { Meteor } from 'meteor/meteor';

import {
  wait,
  sleep,
  schema,
  run,
  defaultAuthed,
  customValidate,
  test1,
  testAsync,
  asyncMethod,
  rateLimited,
  errorMethod,
  wait100,
  fastMethod,
  configMethod,
  simplePipeline,
  asyncPipeline,
  methodUnblock,
  contextMethod,
  getEvents,
  contextFailedMethod,
  addSelected,
  addSelectedAsync,
  rollBackAsync,
  removeSelected,
  Selected,
  globalBefore,
  globalAfter,
  setOptions
} from './test-methods.js';

Tinytest.addAsync('methods - basic', async (test) => {
  const result = await test1();

  test.equal(result, 5);
});


Tinytest.addAsync('methods - basic async', async (test) => {
  const result = await testAsync({num: 1});
  test.equal(result, 10);
});

Tinytest.addAsync('methods - authed by default', async (test) => {
  try {
    const result = await defaultAuthed();
    test.equal('should never be reached', true);
  } catch(e) {
    test.equal(e.message, 'Not logged in')
  }
});

Tinytest.addAsync('methods - custom validate', async (test) => {
  const result = await customValidate({ num: 20 });
  test.equal(result, 20);
});

if (Meteor.isClient) {
  Tinytest.addAsync('methods - error', async (test) => {
    try {
      await errorMethod();
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.message, 'test error');
    }
  });
}

if (Meteor.isClient) {
  Tinytest.addAsync('methods - unblock', async (test) => {
    const result = await methodUnblock(5);

    test.equal(result, 5);
  });
} else {
  Tinytest.addAsync('methods - unblock resolves correctly on server', async (test) => {
    const result = await methodUnblock(5);

    test.equal(result, 10);
  });
}


if (Meteor.isClient) {
  // for some reason this test will fail when run with the other tests, but if it's run by itself it passes
  // rateLimit also works when used so I think it must have something to do with Tinytest
  Tinytest.addAsync('methods - rate limit', async (test) => {
    for (let i = 0; i < 5; i++) {
      await rateLimited();
    }

    try {
      await rateLimited();
      test.equal('should never be reached', true);
    } catch (e) {
      test.equal(e.error, 'too-many-requests');
    }
  });
}


if (Meteor.isClient) {
  Tinytest.addAsync('methods - async parallelize', async (test) => {
    let order = [];

    await Promise.all([
      wait100().then(() => order.push('wait100')),
      fastMethod().then(() => order.push('fastMethod'))
    ]);

    test.equal(order, ['fastMethod', 'wait100']);
  });
} else {
  Tinytest.addAsync('methods - async block by default', async (test) => {
    let order = [];

    await Promise.all([
      wait100().then(() => order.push('wait100')),
      fastMethod().then(() => order.push('fastMethod'))
    ]);

    test.equal(order, ['wait100', 'fastMethod']);
  });
}


Tinytest.addAsync('methods - async sequential', async (test) => {
  let order = [];

  await wait100()
  order.push('wait100')
  await fastMethod()
  order.push('fastMethod')

  test.equal(order, ['wait100', 'fastMethod']);
});

Tinytest.addAsync('methods - pipeline', async (test) => {
  const result = await simplePipeline(10)

  test.equal(result, 14.5);
});

Tinytest.addAsync('methods - async pipeline', async (test) => {
  const result = await asyncPipeline(10)

  test.equal(result, 14.5);
});

Tinytest.addAsync('methods - context success', async (test) => {
  const result = await contextMethod(5);
  test.equal(result, true);

  const events = await getEvents();
  test.equal(events, ['result: true']);
});


Tinytest.addAsync('methods - context error', async (test) => {
  try {
    await contextFailedMethod(5);
    test.equal('should never be reached', true);
  } catch (e) {
    test.equal(e.message, '[second err]');
  }

  const events = await getEvents();
  test.equal(events, ['first err', 'first err']);
});

Tinytest.addAsync('methods - insert', async (test) => {
  const result = await addSelected({num: 1});
  test.equal(result, '123');
});

Tinytest.addAsync('methods - insertAsync', async (test) => {
  const result = await addSelectedAsync({num: 1});
  test.equal(result, '2');
});

/*
// probably run independently, can screw up the other tests
Tinytest.addAsync('methods - global before', async (test) => {
  const result = await globalBefore(5);
  test.equal(result, 6);
}); */

/*
// must be run on its own otherwise it screws up other tests
Tinytest.addAsync('methods - global after', async (test) => {
  const result = await globalAfter(5);
  test.equal(result, 4);
}); */

if (Meteor.isClient) {
  Tinytest.addAsync('methods - set returnStubValue false', async (test) => {
    const result = await setOptions(5);
    test.equal(result, undefined);
  });
}

Tinytest.addAsync('methods - async .then', async (test) => {
  const result = await asyncMethod({ num: 3000 }).then(result => {
    test.equal(result, 'result,result2,3000');
  });
});


Tinytest.addAsync('methods - rollBack', async (test) => {
  try {
    const result = await rollBackAsync({num: 2})
    test.equal(result, '4')
  } catch(e) {
    test.equal(e.message, 'server error')
    const result = await Selected.findOneAsync({_id: '4'})
    test.equal(result, undefined)
  }
});



