const path = require('path');

module.exports = {
    extends: 'airbnb/base',
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['~utils', path.resolve(__dirname, './src/utils')],
                ],
                extensions: ['.js'],
            },
        },
    },
    rules: {
        indent: ['error', 4],
    },
};
