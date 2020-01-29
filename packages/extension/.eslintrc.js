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
                    ['~uiModules', path.resolve(__dirname, './src/ui')],
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
