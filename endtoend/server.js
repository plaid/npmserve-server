'use strict';

/* global after, before, describe, it */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const P = require('bluebird');
const expect = require('chai').expect;
const request = require('request');

const serverRootPath = path.join(__dirname, '..');
const serverPackageJson = path.join(serverRootPath, 'package.json');
const developmentBinaryPath = path.join(serverRootPath, 'bin/development');

const spawn = childProcess.spawn;
const spawnSync = childProcess.spawnSync;

const requestAsync = P.promisify(request);

const NPMSERVE_TEST_SERVER_ORIGIN = 'http://localhost:3000';
const SERVER_STARTUP_PATTERN = /running with environment/;

//
// End-to-end tests for npmserve-server. The tests work by starting a local
// server, having it build its own npm dependencies, then verifying the result.
//

var $serverProcess;

before((done) => {
  console.info('starting a test server');

  $serverProcess = spawn(developmentBinaryPath);

  $serverProcess.stdout.on('data', (data) => {
    console.log('server-stdout: ' + data);
    if (data.toString().match(SERVER_STARTUP_PATTERN)) {
      console.info('server started!');
      // short timeout to allow the server to bind
      setTimeout(done, 1000);
    }
  });

  $serverProcess.stderr.on('data', (data) => {
    console.error('server-stderr: ' + data);
  });

  $serverProcess.on('close', (code) => {
    console.log('child process exited with code ' + code);
  });
});

after(() => {
  console.info('shutting down the test server: ', $serverProcess.pid);
  $serverProcess.kill();
});

const testServerInstall = P.promisify((packageJson, callback) => {
  const req = {form: {packageJson: packageJson}};

  request.post(NPMSERVE_TEST_SERVER_ORIGIN + '/npm/install', req)
  .on('response', function(response) {
    expect(response.statusCode).to.deep.equal(200);
    expect(response.headers['content-type']).to.deep
      .equal('application/octet-stream');

    // provide a delay for piping the response to disk
    setTimeout(() => {
      const verifyProcess = spawnSync('gunzip',
        ['-t', 'node_modules.tar.gz'], {cwd: serverRootPath});
      expect(verifyProcess.status).to.deep.equal(0);
      callback();
    }, 3000);
  })
  .pipe(fs.createWriteStream('node_modules.tar.gz'));
});

const testHash = (packageJson, expectedHash) => {
  return requestAsync({
    uri: NPMSERVE_TEST_SERVER_ORIGIN + '/npm/hash',
    method: 'POST',
    body: JSON.stringify({
      packageJson: packageJson
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then((response) => {
    expect(response.body).to.deep.equal(expectedHash);
    expect(response.statusCode).to.deep.equal(200);
  });
};

const testDelete = (hash) => {
  return requestAsync({
    uri: NPMSERVE_TEST_SERVER_ORIGIN + '/npm/install/' + hash,
    method: 'DELETE',
  })
  .then((response) => {
    expect(response.body).to.deep.equal('build deleted');
    expect(response.statusCode).to.deep.equal(200);
  });
};

const PACKAGE_JSON_EMPTY = '{}';
const PACKAGE_JSON_SERVER = JSON.stringify(require(serverPackageJson));
const HASH_PACKAGE_JSON_EMPTY = '99914b932bd37a50b983c5e7c90ae93b';

describe('npmserve-server', () => {

  describe('POST /npm/hash', () => {
    it('should return the hash of the package.json', () => {
      return testHash(PACKAGE_JSON_EMPTY, HASH_PACKAGE_JSON_EMPTY);
    });
  });

  describe('POST /npm/install', () => {
    it('should perform an npm install', () => {
      return testServerInstall(PACKAGE_JSON_SERVER);
    });

    it('should perform an install on an empty dependency set', () => {
      return testServerInstall(PACKAGE_JSON_EMPTY);
    });
  });

  describe('DELETE /npm/install', () => {
    it('should delete a build from the server', () => {
      return P.resolve()
        .then(() => testServerInstall(PACKAGE_JSON_EMPTY))
        .then(() => testHash(PACKAGE_JSON_EMPTY, HASH_PACKAGE_JSON_EMPTY))
        .then(() => testDelete(HASH_PACKAGE_JSON_EMPTY));
    });
  });
});
