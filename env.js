'use strict';

const envvar = require('envvar');

module.exports = {
  BUILD_DATA_DIR:
    envvar.string('BUILD_DATA_DIR', './data'),
  NPM_CONFIG_REGISTRY:
    envvar.string('NPM_CONFIG_REGISTRY', 'https://registry.npmjs.org/')
};
