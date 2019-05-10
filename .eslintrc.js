module.exports = {
    extends: ['airbnb-base', 'prettier'],
    env: {
        browser: true,
        mocha: true,
        node: true,
    },
    rules: {
        'arrow-body-style': 'off',
        'comma-dangle': ['error', 'always-multiline'],
        'import/no-dynamic-require': 'off',
        'import/no-extraneous-dependencies': 'off',
        indent: [
            'error',
            4,
            {
                SwitchCase: 1,
            },
        ],
        'linebreak-style': 'off',
        'max-len': [
            'warn',
            130,
            {
                ignoreComments: true,
            },
            {
                ignoreTrailingComments: true,
            },
        ],
        'no-console': 'off',
        'no-trailing-spaces': [
            'error',
            {
                ignoreComments: true,
            },
        ],
        'no-underscore-dangle': [
            'error',
            {
                allow: ['_id'],
            },
        ],
        'no-unused-vars': [
            'error',
            {
                varsIgnorePattern: '_',
            },
        ],
        'prefer-template': 'off',
        strict: 'off',
    },
};
