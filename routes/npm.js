const fs = require('fs');
const path = require('path');

const P = require('bluebird');
const crypto = require('crypto');
const express = require('express');
const lockfile = require('lockfile');
const R = require('ramda');
const rimraf = require('rimraf');
const childProcessPromise = require('child-process-promise');

const env = require('../env');

const errorHandler = require('../util/error-handler');
const fsUtils = require('../util/fs');
const nodePackage = require('../util/node-package');

P.promisifyAll(fs);
P.promisifyAll(lockfile);

const rmRfPromise = P.promisify(rimraf);

const router = express.Router();
const logger = console;

//
// Route for executing remote NPM commands.
//

const ARCHIVE_FILE = 'node_modules.tar.gz';
const LOCK_FILE = 'folder.lock';

//
// spawn a child process, saving output to the build directory.
//
const spawnWrapper = function(command, spawnArgs, options, buildDir) {
  const spawnOpts = R.merge(options, {capture: ['stdout', 'stderr']});

  return childProcessPromise.spawn(command, spawnArgs, spawnOpts)
  .then((result) => {
    logger.info('spawnWrapper: ' + command + ' returned');
    return Promise.all([
      fs.writeFileAsync(path.join(buildDir, command + '.out'), result.stdout),
      fs.writeFileAsync(path.join(buildDir, command + '.err'), result.stderr)
    ]);
  });
};

//
// POST /hash
// body: { packageJson: String }
// compute and return the hash for the specified package.json.
//
router.post('/hash', (req, res, next) => {
  return P.resolve()
  .then(() => {
    const packageJson = req.body.packageJson;
    const hash = crypto.createHash('md5').update(packageJson).digest('hex');
    res.send(hash);
  })
  .catch(errorHandler(res));
});

//
// DELETE /install/:hash
// delete the server's build for the specified hash.
//
router.delete('/install/:hash', (req, res, next) => {
  var $lockFile;

  return P.resolve()
  .then(() => {
    const hash = req.params.hash;
    const buildDir = path.join(env.BUILD_DATA_DIR, hash);

    if (fs.existsSync(buildDir)) {
      $lockFile = path.join(buildDir, LOCK_FILE);
      return P.resolve()
      .then(() => {
        return lockfile.lockAsync($lockFile);
      })
      .then(() => {
        return rmRfPromise(buildDir);
      });
    } else {
      return P.resolve();
    }
  })
  .then(() => {
    res.send('build deleted');
  })
  .catch(errorHandler(res))
  .finally(() => {
    // TODO make sure build dir is gone, generally
    // No need to unlock because we deleted the lockFile.
    logger.info('lockfile deleted');
  });
});

//
// POST /install
// body: { packageJson: String }
// build a node_modules tarball from an uploaded package.json.
//
router.post('/install', (req, res, next) => {
  var $lockFile;
  var $buildOpts;

  return P.resolve()
  .then(() => {
    const packageJson = req.body.packageJson;
    const hash = crypto.createHash('md5').update(packageJson).digest('hex');
    const buildDir = path.join(env.BUILD_DATA_DIR, hash);
    const packageJsonFile = path.join(buildDir, 'package.json');
    const archiveFile = path.join(buildDir, ARCHIVE_FILE);
    $lockFile = path.join(buildDir, LOCK_FILE);

    nodePackage.validatePackageJson(packageJson);

    $buildOpts = {
      name: JSON.parse(packageJson).name,
      hash: hash
    };

    const npmEnv = R.merge({
      npm_config_registry: env.NPM_CONFIG_REGISTRY
    }, process.env);

    logger.info('build requested', $buildOpts);

    return P.resolve()
    .then(() => {
      return fsUtils.mkdirp(buildDir);
    })
    .then(() => {
      return lockfile.lockAsync($lockFile);
    })
    .then(() => {
      logger.info('lock acquired', $buildOpts);
      logger.info('writing package json file', $buildOpts);
      return fs.writeFileAsync(packageJsonFile, packageJson);
    })
    .then(() => {
      const isAlreadyBuilt = fs.existsSync(archiveFile);
      if (isAlreadyBuilt) {
        return P.resolve();
      } else {
        return P.resolve()
        .then(() => {
          logger.info('execute npm install', $buildOpts);
          return spawnWrapper('npm', ['install', '--no-shrinkwrap'], {
            cwd: buildDir,
            env: npmEnv
          }, buildDir);
        })
        .then(() => {
          logger.info('creating build archive', $buildOpts);
          return spawnWrapper('tar', ['-czf', ARCHIVE_FILE, 'node_modules'], {
            cwd: buildDir
          }, buildDir);
        });
      }
    })
    .then(() => {
      // delay to prevent empty response error which occors occasionally.
      // TODO: investigate what causes the error.
      return P.delay(100);
    })
    .then(() => {
      logger.info('delivering archive', $buildOpts);
      res.sendFile(archiveFile);
    });
  })
  // TOOD: we should also delete the entire build directory if something fails.
  .catch(errorHandler(res))
  .finally(() => {
    if ($lockFile != null) {
      lockfile.unlockSync($lockFile);
      logger.info('lock released', $buildOpts);
    }
  });
});

//
// POST /cache/clean
// clear the NPM cache on the server.
//
router.post('/cache/clean', (req, res, next) => {
  return Promise.resolve()
  .then(() => {
    logger.info('clearing cache');
    return childProcessPromise.spawn('npm', ['cache', 'clean'], {});
  })
  .then(() => {
    logger.info('cache cleared');
    res.send('cache cleared');
  })
  .catch(errorHandler(res));
});

module.exports = router;
