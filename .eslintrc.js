
// .eslintrc.js
const path = require('path')

module.exports = {
    "settings": {
        'import/resolver': {
            'eslint-import-resolver-lerna': {
                packages: path.resolve(__dirname, './packages')
            },
        },
    },
    "extends": "airbnb-base",
    "env": {
        "browser": true,
        "mocha": true,
        "node": true,
    },
    "rules": {
        "arrow-body-style": 0,
        "comma-dangle": [
            "error",
            {
                "arrays": "always-multiline",
                "objects": "always-multiline",
                "imports": "always-multiline",
                "exports": "always-multiline",
                "functions": "never"
            }
        ],
        "import/no-dynamic-require": 0,
        "import/no-extraneous-dependencies": 0,
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "linebreak-style": 0,
        "max-len": [
            "warn",
            130,
            {
                "ignoreComments": true
            },
            {
                "ignoreTrailingComments": true
            }
        ],
        "no-console": 0,
        "no-underscore-dangle": [
            "error",
            {
                "allow": [
                    "_id"
                ]
            }
        ],
        "no-trailing-spaces": [
            "error",
            { "ignoreComments": true }
        ],
        "prefer-template": 0,
        "strict": 0,
    }
};
