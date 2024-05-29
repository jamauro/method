Package.describe({
  name: 'jam:method',
  version: '2.0.0-rc1',
  summary: 'An easy way to create Meteor methods',
  git: 'https://github.com/jamauro/method',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('2.8.1', '3.0-alpha.19');
  api.use('ecmascript');
  api.use('check');
  api.use('mongo@2.0.0-rc300.2');
  api.use('ddp-rate-limiter', 'server');
  api.use('jam:easy-schema@1.3.1-alpha300.19', { weak: true });
  api.use('zodern:types@1.0.11');
  api.addAssets('method.d.ts', 'server');
  api.mainModule('method.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('mongo');
  api.use('jam:easy-schema@1.3.1-alpha300.19');
  api.use('jam:method');
  api.addFiles('test-methods.js');
  api.mainModule('tests.js');
});
