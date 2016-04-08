const P = require('bluebird');
const express = require('express');
const childProcessPromise = require('child-process-promise');
const R = require('ramda');

const env = require('../env');
const errorHandler = require('../util/error-handler');

const serverPackage = require('../package.json');
const router = express.Router();

const BUILD_DATA_DIR = env.BUILD_DATA_DIR;

/* GET home page. */
router.get('/', (req, res, next) => {
  return P.resolve()
  .then(() => {
    return childProcessPromise.spawn('find', [
      BUILD_DATA_DIR, '-maxdepth', '2', '-name', 'package.json'
    ], {capture: ['stdout', 'stderr']});
  })
  .then((result) => {
    const packageJsons = result.stdout.toString().split(/\s+/).filter((s) =>
      s.length);

    const builds = packageJsons.map((packageJsonPath) => {
      const pjson = require(packageJsonPath);
      const version = (pjson.version == null) ? 'unknown' : pjson.version;

      return {
        version: version,
        name: pjson.name,
        path: packageJsonPath,
        hash: R.head(R.tail(R.reverse(packageJsonPath.split('/'))))
      };
    });

    res.render('index', {
      title: 'npmserve',
      version: serverPackage.version,
      builds: R.sortBy(R.prop('name'), builds)
    });
  })
  .catch(errorHandler(res));
});

module.exports = router;
