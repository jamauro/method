Package.describe({
  name: 'jam:method',
  version: '1.2.1',
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
  api.use('jam:easy-schema@1.0.0', {weak: true});
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
