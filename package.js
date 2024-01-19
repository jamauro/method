Package.describe({
  name: 'jam:method',
  version: '1.4.1',
  summary: 'An easy way to create Meteor methods',
  git: 'https://github.com/jamauro/method',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('2.8.1');
  api.use('ecmascript');
  api.use('check');
  api.use('mongo');
  api.use('ddp-rate-limiter', 'server');
  api.use('jam:easy-schema@1.3.0-alpha300.19', { weak: true });
  api.use('zodern:types@1.0.11');
  api.addAssets('method.d.ts', 'server');
  api.mainModule('method.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('mongo');
  api.use('jam:easy-schema');
  api.use('jam:method');
  api.addFiles('test-methods.js');
  api.mainModule('method-tests.js');
});
