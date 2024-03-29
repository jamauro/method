## 1.5.1
* fix: optimizations for `.validate.only`

## 1.5.0
* feat: `.validate` - validate without executing the method
* feat: `.validate.only` - validate only a subset without executing the method

## 1.4.2
* fix: allow custom validate function to be async
* fix: improve typescript declarations for better code completion

## 1.4.1
* fix: typescript only issue with .d.ts file

## 1.4.0
* feat: better typescript and code completion support via declaration file (.d.ts)
* feat: functional-style method syntax
* feat: support methods without params and skip requiring schema or validate function
* fix: improvements when using `attachMethods`
* fix: optimizations to `jam:easy-schema` integration

## 1.3.1
* fix: bug when attaching methods

## 1.3.0
* feat: improve integration with `jam:easy-schema` and introduce `schema`, `server`, `open`, `close` functions
* breaking: rename `isPublic` config option to `open`

## 1.2.1
* fix: individual method config should override global config

## 1.2
* feat: custom logged out error

## 1.1.1
* fix: handling stub exceptions

## 1.1.0
* feat: support more schema packages

## 1.0
* initial version
