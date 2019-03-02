#!/usr/bin/env node

const compile = require('./commands/compile');
const init = require('./commands/init');
const config = require('../config');

// eslint-disable-next-line no-unused-expressions
require('yargs')
    .command({
        command: 'compile',
        desc: 'compile a huff project',
        builder: {},
        handler: () => {
            compile(config);
        },
    })
    .command({
        command: 'init',
        desc: 'init a huff project',
        builder: {},
        handler: () => {
            init(config);
        },
    })
    .demandCommand()
    .help()
    .wrap(72)
    .argv;
