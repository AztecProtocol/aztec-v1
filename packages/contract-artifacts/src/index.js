const path = require('path');
const requireDir = require('require-dir');

const artifacts = requireDir(path.join(__dirname, '..', 'artifacts'));
module.exports = artifacts;
