const path = require('path');

const constants = require(path.join(__dirname, 'constants'));
const exceptions = require(path.join(__dirname, 'exceptions'));
const errors = require(path.join(__dirname, 'errors'));

module.exports = {
    constants,
    exceptions,
    errors,
};
