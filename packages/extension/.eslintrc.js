const path = require('path');

module.exports = {
    extends: 'airbnb/base',
    parser: 'babel-eslint',
    env: {
        browser: true,
        es6: true,
        node: true,
        jest: true,
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['~config', path.resolve(__dirname, './src/config')],
                    ['~utils', path.resolve(__dirname, './src/utils')],
                    ['~database', path.resolve(__dirname, './src/database')],
                ],
                extensions: ['.js'],
            },
        },
    },
    rules: {
        indent: ['error', 4],
        'max-len': ['error', {
            code: 100,
            ignoreComments: true,
            ignoreTrailingComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
        }],
    },
};
