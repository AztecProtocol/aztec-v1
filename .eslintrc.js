module.exports = {
    "extends": "airbnb-base",
    "env": {
        "mocha": true,
        "node": true,
        "browser": true
    },
    "rules": {
        "strict": 0,
        "arrow-body-style": 0,
        "no-trailing-spaces": [
            "error",
            { "ignoreComments": true }
        ],
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
        "import/no-extraneous-dependencies": 0,
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "linebreak-style": 0,
        "no-console": 0,
        "no-underscore-dangle": [
            "error",
            {
                "allow": [
                    "_id"
                ]
            }
        ],
        "prefer-template": 0,
        "max-len": [
            "warn",
            130,
            {
                "ignoreComments": true
            },
            {
                "ignoreTrailingComments": true
            }
        ]
    }
};
