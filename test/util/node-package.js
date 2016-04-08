'use strict';

/* global describe, it */

const expect = require('chai').expect;

const nodePackage = require('../../util/node-package');

describe('node-package', () => {

  describe('#validatePackageJson', () => {
    it('should pass on valid package', () => {
      const valid = '{}';
      expect(() => nodePackage.validatePackageJson(valid)).not.to.throw();
    });

    it('should throw on invalid package', () => {
      const invalid = '{';
      expect(() => nodePackage.validatePackageJson(invalid)).to.throw();
    });
  });

});
