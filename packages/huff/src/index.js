/* eslint-disable import/no-dynamic-require */
const path = require('path');

const compiler = require(path.join(__dirname, 'compiler'));
const parser = require(path.join(__dirname, 'parser'));
const Runtime = require(path.join(__dirname, 'runtime'));

module.exports = {
    compiler,
    parser,
    Runtime,
};
