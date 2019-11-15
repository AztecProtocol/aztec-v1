const path = require('path');

module.exports = {
    extends: 'airbnb',
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
                    ['~background', path.resolve(__dirname, './src/background')],
                    ['~content', path.resolve(__dirname, './src/content')],
                    ['~client', path.resolve(__dirname, './src/client')],
                    ['~ui', path.resolve(__dirname, './src/ui')],
                    ['~uiModules', path.resolve(__dirname, './src/ui')],
                    ['~helpers', path.resolve(__dirname, './src/helpers')],
                    ['~testHelpers', path.resolve(__dirname, './tests/helpers')],
                    ['~', path.resolve(__dirname, './src')],
                ],
                extensions: ['.js', '.jsx'],
            },
        },
    },
    rules: {
        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
            },
        ],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        'react/jsx-curly-brace-presence': 'off',
        'max-len': ['error', {
            code: 100,
            ignoreComments: true,
            ignoreTrailingComments: true,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true,
        }],
        'import/no-unresolved': ['error', {
            ignore: ['^~contracts/'],
        }],
    },
};
