const childProcessPromise = require('child-process-promise');

//
// Utility functions for working with the filesystem.
//

const mkdirp = (path) => {
  return childProcessPromise.spawn('mkdir', ['-p', path]);
};

const rmrf = (path) => {
  return childProcessPromise.spawn('rm', ['-rf', path]);
};

module.exports = {
  mkdirp: mkdirp,
  rmrf: rmrf
};
