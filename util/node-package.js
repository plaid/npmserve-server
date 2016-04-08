//
// Utilities for working with node package.json files
//

const validatePackageJson = (packageJson) => {
  try {
    JSON.parse(packageJson);
  } catch (err) {
    console.error('the provided package.json was not parseable', packageJson);
    throw new Error('the provided package json was not parseable');
  }
};

module.exports = {
  validatePackageJson: validatePackageJson
};
