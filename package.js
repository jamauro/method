Package.describe({
  name: 'jam:method',
  version: '1.6.0-rc.4',
  summary: 'An easy way to create Meteor methods',
  git: 'https://github.com/jamauro/method',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom(['2.8.1', '3.0-rc.4']);
  api.use('ecmascript');
  api.use('check');
  api.use('mongo');
  api.use('ddp-rate-limiter', 'server');
  api.use('jam:easy-schema@1.3.1-rc.4', { weak: true });
  api.use('zodern:types@1.0.13');
  api.addAssets('method.d.ts', 'server');
  api.mainModule('method.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('mongo');
  api.use('jam:easy-schema@1.3.1-rc.4');
  api.use('jam:method');
  api.addFiles('test-methods.js');
  api.mainModule('tests.js');
});
