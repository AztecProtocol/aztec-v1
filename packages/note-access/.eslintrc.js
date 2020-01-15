const path = require('path');

module.exports = {
    extends: ['airbnb-base', 'prettier'],
    parser: 'babel-eslint',
    env: {
        es6: true,
        node: true,
        jest: true,
    },
    rules: {
        'no-console': 'off',
        'no-underscore-dangle': 'off',
    },
};
