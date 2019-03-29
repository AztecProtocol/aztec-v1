const { existsSync, lstatSync } = require('fs');
const { checker, check, add, ValueError } = require('blork');
const { Signale } = require('signale');
const { Writable } = require('stream');
const { WritableStreamBuffer } = require('stream-buffers');

// Get some checkers.
const isAbsolute = checker('absolute');
const isObject = checker('object');
const isString = checker('string');

// Add a directory checker.
add(
    'directory',
    (v) => isAbsolute(v) && existsSync(v) && lstatSync(v).isDirectory(),
    'directory that exists in the filesystem',
);

// Add a writable stream checker.
add(
    'stream',
    // istanbul ignore next (not important)
    (v) => v instanceof Writable || v instanceof WritableStreamBuffer,
    'instance of stream.Writable or WritableStreamBuffer',
);

// Exports.
module.exports = { checker, check, ValueError };
