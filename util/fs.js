const childProcessPromise = require('child-process-promise');

//
// Utility functions for working with the filesystem.
//

const mkdirp = (path) => {
  return childProcessPromise.spawn('mkdir', ['-p', path]);
};

module.exports = {
  mkdirp: mkdirp
};
