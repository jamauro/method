import { Tinytest } from 'meteor/tinytest';
import { Meteor } from 'meteor/meteor';

import {
  schema,
  run,
  defaultAuthed,
  checkSchema,
  zodSchema,
  simpleSchema,
  customValidate,
  customValidateAsync,
  test1,
  testAsync,
  asyncMethod,
  rateLimited,
  errorMethod,
  wait100,
  fastMethod,
  beforeMethod,
  beforeArrayMethod,
  afterMethod,
  afterArrayMethod,
  serverOnly,
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
  setOptions,
  checkOwnership,
  addSelectedAsyncWithOwner,
  addSelectedAsyncWithOwnerPipe,
  numMethod,
  numMethod2,
  editMethod,
  editMethod2,
  editMethod3,
  editMethod4,
  closedMethod,
  closedMethod2,
  closedMethod3,
  openMethod,
  openMethod2,
  openMethod3,
  schemalessMethod,
  schemalessMethod2,
  schemalessMethod3,
  schemaedMethod,
  schemaedMethod2,
  schemaedMethod3,
  Todos
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
    test.equal(e.reason, 'You must be logged in')
  }
});

Tinytest.addAsync('methods - check schema', async (test) => {
  const result = await checkSchema({ num: 25, isPrivate: true });
  test.equal(result, 50);
});

Tinytest.addAsync('methods - zod schema', async (test) => {
  const result = await zodSchema({ num: 4, isPrivate: true });
  test.equal(result, 40);
});

Tinytest.addAsync('methods - SimpleSchema', async (test) => {
  const result = await simpleSchema({ num: 5, isPrivate: true });
  test.equal(result, 100);
});

Tinytest.addAsync('methods - custom validate', async (test) => {
  const result = await customValidate({ num: 20 });
  test.equal(result, 20);
});

Tinytest.addAsync('methods - custom validate async', async (test) => {
  const result = await customValidateAsync({ num: 20 });
  test.equal(result, 20);
});

Tinytest.addAsync('methods - custom validate async fail', async (test) => {
  try {
    const result = await customValidateAsync({ num: 5 });
    test.equal('should never be reached', true);
  } catch (error) {
    test.equal(error, 'fail')
  }
});

Tinytest.addAsync('.validate - check schema', async (test) => {
  try {
    const result = checkSchema.validate({ num: 25, isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - check schema fail', async (test) => {
  try {
    const result = checkSchema.validate({ num: '25', isPrivate: true });
    test.equal('should not be reached', true)
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - check .only schema', async (test) => {
  try {
    const result = checkSchema.validate.only({ isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - check .only schema fail', async (test) => {
  try {
    const result = checkSchema.validate.only({ isPrivate: 'true' });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - zod schema', async (test) => {
  try {
    const result = await zodSchema.validate({ num: 4, isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - zod schema fail', async (test) => {
  try {
    const result = await zodSchema.validate({ num: '4', isPrivate: true });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - zod schema .only', async (test) => {
  try {
    const result = await zodSchema.validate.only({ isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - zod schema .only fail', async (test) => {
  try {
    const result = await zodSchema.validate.only({ isPrivate: 'true' });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - SimpleSchema', async (test) => {
  try {
    const result = await simpleSchema.validate({ num: 5, isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - SimpleSchema fail', async (test) => {
  try {
    const result = await simpleSchema.validate({ num: '5', isPrivate: true });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - SimpleSchema .only', async (test) => {
  try {
    const result = await simpleSchema.validate.only({ isPrivate: true });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - SimpleSchema .only fail', async (test) => {
  try {
    const result = await simpleSchema.validate.only({ isPrivate: 'true' });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - custom validate', async (test) => {
  try {
    const result = await customValidate.validate({ num: 20 });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - custom validate fail', async (test) => {
  try {
    const result = await customValidate.validate({ num: '20' });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
});

Tinytest.addAsync('.validate - custom validate async', async (test) => {
  try {
    const result = await customValidateAsync.validate({ num: 20 });
  } catch (error) {
    test.equal('should not be reached', true)
  }
});

Tinytest.addAsync('.validate - custom validate async fail', async (test) => {
  try {
    const result = await customValidateAsync.validate({ num: 20 });
  } catch (error) {
    test.isTrue(error instanceof Error)
  }
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

Tinytest.addAsync('methods - beforeMethod', async (test) => {
  const result = await beforeMethod({num: 10})

  test.equal(result, 20);
});

Tinytest.addAsync('methods - beforeArrayMethod', async (test) => {
  const result = await beforeArrayMethod({num: 20})

  test.equal(result, 40);
});

Tinytest.addAsync('methods - afterMethod', async (test) => {
  const result = await afterMethod({num: 10})

  test.equal(result, 30);
});

Tinytest.addAsync('methods - afterArrayMethod', async (test) => {
  const result = await afterArrayMethod({num: 20})

  test.equal(result, 60);
});

Tinytest.addAsync('methods - serverOnly', async (test) => {
  const result = await serverOnly({num: 5})

  if (Meteor.isClient) {
    test.equal(result, undefined);
  } else {
    test.equal(result, 15);
  }
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
});

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

Tinytest.addAsync('methods - check ownership pipe', async (test) => {
  try {
    const result = await addSelectedAsyncWithOwnerPipe({num: 2, ownerId: '12'})
    test.equal(result, '6')
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('methods - check ownership run', async (test) => {
  try {
    const result = await addSelectedAsyncWithOwner({num: 4, ownerId: '20'})
    test.equal(result, '12')
  } catch(e) {
    console.error(e)
  }
});

if (Meteor.isClient) {
  Tinytest.addAsync('attached methods - create', async (test) => {
    try {
      const result = await Todos.create({text: 'hi'})
      test.isTrue(result)
    } catch(e) {
      console.error('create', e)
    }
  });

  Tinytest.addAsync('attached methods - edit', async (test) => {
    try {
      const result = await Todos.edit({text: 'bye'})
      if (Meteor.isClient) {
        test.equal(result, undefined)
      } else {
        test.equal(result, 'bye')
      }
    } catch(e) {
      console.error(e)
    }
  });

  Tinytest.addAsync('attached methods - num', async (test) => {
    try {
      const result = await Todos.num(5)
      test.equal(result, 5);
    } catch(e) {
      console.error(e)
    }
  });

  Tinytest.addAsync('attached methods - num fail', async (test) => {
    try {
      const result = await Todos.num('5')
    } catch(e) {
      console.error(e)
      test.equal(e.details[0].message, 'Expected number, got string')
    }
  });

  Tinytest.addAsync('attached methods - custom', async (test) => {
    try {
      const result = await Todos.custom({ _id: '1', num: 10 })
      test.equal(result, {_id: '1', num: 10});
    } catch(e) {
      console.error(e)
    }
  });

  Tinytest.addAsync('attached methods - custom fail', async (test) => {
    try {
      const result = await Todos.custom({ _id: '1', num: '10' })
    } catch(e) {
      console.error(e);
      test.equal(e.details[0].message, 'Num must be a number, not string');
    }
  });

  Tinytest.addAsync('attached methods - authRequired', async (test) => {
    try {
      const result = await Todos.authRequired({ text: 'hi' })
    } catch(e) {
      console.error(e)
      test.isTrue(e)
    }
  });

  Tinytest.addAsync('attached methods - openMethod', async (test) => {
    try {
      const result = await Todos.unAuthed({ text: 'hi' })
      test.equal(result, 'hi');
    } catch(e) {
      console.error(e)
    }
  });
}

/* test fn.name manually via console log
Tinytest.addAsync('functional syntax - names', async (test) => {
  await numMethod(1).catch(e => console.error(e)) // fn.name number-1
  await numMethod2(2).catch(e => console.error(e)) // fn.name number-2
  await editMethod({text: 'hi'}).catch(e => console.error(e)), // fn.name edit2
  await editMethod2({text: 'hi'}).catch(e => console.error(e)), // fn.name text-4, serverOnly
  await editMethod3({text: 'hi'}).catch(e => console.error(e)), // fn.name edit4, serverOnly
  await editMethod4({text: 'hi'}).catch(e => console.error(e)), // fn.name text-6, serverOnly
  await closedMethod({text: 'hi'}).catch(e => console.error(e)), // fn.name text-7
  await closedMethod2({text: 'hi'}).catch(e => console.error(e)), // fn.name authRequired2, serverOnly
  await closedMethod3({text: 'hi'}).catch(e => console.error(e)), // fn.name text-9, serverOnly
  await openMethod({text: 'hi'}).catch(e => console.error(e)), // fn.name text-10
  await openMethod2({text: 'hi'}).catch(e => console.error(e)), // fn.name text-11, serverOnly
  await openMethod3({text: 'hi'}).catch(e => console.error(e)) // fn.name unAuthed2, serverOnly
});
*/


Tinytest.addAsync('functional syntax - numMethod', async (test) => {
  try {
    const result = await numMethod(1);
    test.equal(result, 1)
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - numMethod2', async (test) => {
  try {
    const result = await numMethod2(2);
    test.equal(result, 2)
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - editMethod', async (test) => {
  try {
    const result = await editMethod({text: 'hi'})
    test.equal(result, 'hi')
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - editMethod2', async (test) => {
  try {
    const result = await editMethod2({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - editMethod3', async (test) => {
  try {
    const result = await editMethod3({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - editMethod4', async (test) => {
  try {
    const result = await editMethod4({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - closedMethod', async (test) => {
  try {
    const result = await closedMethod({text: 'hi'})
    test.equal(result, 'hi')
  } catch(e) {
    console.error(e)
  }
});


Tinytest.addAsync('functional syntax - closedMethod2', async (test) => {
  try {
    const result = await closedMethod2({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - closedMethod3', async (test) => {
  try {
    const result = await closedMethod3({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - openMethod', async (test) => {
  try {
    const result = await openMethod({text: 'hi'})
    test.equal(result, 'hi')
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - openMethod2', async (test) => {
  try {
    const result = await openMethod2({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('functional syntax - openMethod3', async (test) => {
  try {
    const result = await openMethod3({text: 'hi'})
    if (Meteor.isClient) {
      test.equal(result, undefined)
    } else {
      test.equal(result, 'hi')
    }
  } catch(e) {
    console.error(e)
  }
});

Tinytest.addAsync('schemaless - functional syntax', async (test) => {
  const result = await schemalessMethod();
  test.equal(result, 'hello')
});

Tinytest.addAsync('schemaless - regular syntax', async (test) => {
  const result = await schemalessMethod2();
  test.equal(result, 'hello')
});

Tinytest.addAsync('schemaless - pipe syntax', async (test) => {
  const result = await schemalessMethod3();
  test.equal(result, 'hello')
});

Tinytest.addAsync('schemaed - functional syntax', async (test) => {
  try {
    const result = await schemaedMethod();
  } catch(e) {
    test.equal(e.message, "You must pass in either a schema or a validate function for method 'schemaed'")
  }
});

Tinytest.addAsync('schemaed - regular syntax', async (test) => {
  try {
    const result = await schemaedMethod2();
  } catch(e) {
    test.equal(e.message, "You must pass in either a schema or a validate function for method 'schemaedMethod2'")
  }
});

Tinytest.addAsync('schemaed - pipe syntax', async (test) => {
  try {
    const result = await schemaedMethod3();
  } catch(e) {
    test.equal(e.message, "You must pass in either a schema or a validate function for method 'schemaedMethod3'")
  }
});

