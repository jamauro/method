export const config = {
  before: [],
  after: [],
  options: {
    // Make it possible to get the ID of an inserted item
    returnStubValue: true,

    // Don't call the server method if the client stub throws an error, so that we don't end
    // up doing validations twice
    throwStubExceptions: true,
  },
  arePublic: false,
  basePath: `/imports/api`,
};

export function server(fn) {
  return function(...args) {
    if (Meteor.isServer) {
      return fn(...args)
    }
  }
};
