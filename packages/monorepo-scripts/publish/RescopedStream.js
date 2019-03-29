const { Writable } = require('stream');
const { check } = require('./blork');

/**
 * Create a stream that passes messages through while rewriting scope.
 * Replaces `[semantic-release]` with a custom scope (e.g. `[my-awesome-package]`) so output makes more sense.
 *
 * @param {stream.Writable} stream The actual stream to write messages to.
 * @param {string} scope The string scope for the stream (instances of the text `[semantic-release]` are replaced in the stream).
 * @returns {stream.Writable} Object that's compatible with stream.Writable (implements a `write()` property).
 *
 * @internal
 */
class RescopedStream extends Writable {
    // Constructor.
    constructor(stream, scope) {
        super();
        check(scope, 'scope: string');
        check(stream, 'stream: stream');
        this._stream = stream;
        this._scope = scope;
    }

    // Custom write method.
    write(msg) {
        check(msg, 'msg: string');
        this._stream.write(msg.replace('[semantic-release]', `[${this._scope}]`));
    }
}

// Exports.
module.exports = RescopedStream;
