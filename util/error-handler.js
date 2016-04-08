const R = require('ramda');

//
// application-wide error handler
//

const errorHandler = R.curry((res, err) => {
  console.error(err.message);
  console.error(err.stack);
  console.error(err);

  console.error(JSON.stringify(err.stack));

  const errorMessage = err.message + '\n' +
    err.status + '\n' +
    err.stack + '\n';

  res.status(err.status || 500);
  res.send(errorMessage);
});

module.exports = errorHandler;
