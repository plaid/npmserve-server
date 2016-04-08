'use strict';

/* global after, before, describe, it */

const fs = require('fs');
const path = require('path');

const request = require('request');
const expect = require('chai').expect;

const serverRootPath = path.join(__dirname, '..');

const serverPackageJson = path.join(serverRootPath, 'package.json');
const developmentBinaryPath = path.join(serverRootPath, 'bin/development');

const spawn = require('child_process').spawn;
const spawnSync = require('child_process').spawnSync;

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
  console.info('shutting down the test server');
  $serverProcess.kill();
});


describe('npmserve-server', () => {

  describe('route /npm/install', () => {

    it('should perform an npm install', (done) => {
      const pjsonString = JSON.stringify(require(serverPackageJson));
      const req = {form: {packageJson: pjsonString}};

      request.post('http://localhost:3000/npm/install', req)
      .on('response', function(response) {
        expect(response.statusCode).to.deep.equal(200);
        expect(response.headers['content-type']).to.deep
          .equal('application/octet-stream');

        // provide a delay for piping the response to disk
        setTimeout(() => {
          const verifyProcess = spawnSync('gunzip',
            ['-t', 'node_modules.tar.gz'], {cwd: serverRootPath});
          expect(verifyProcess.status).to.deep.equal(0);
          done();
        }, 10000);
      })
      .pipe(fs.createWriteStream('node_modules.tar.gz'));
    });
  });
});
