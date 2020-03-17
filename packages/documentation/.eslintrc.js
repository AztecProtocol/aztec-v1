module.exports = {
    extends: ['airbnb', 'prettier'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        sourceType: 'module',
    },
    env: {
        browser: true,
        mocha: true,
        node: true,
        es6: true,
        jest: true,
    },
    plugins: ['react', 'jsx-a11y', 'import'],
    settings: {
        'import/resolver': {
            alias: {
                map: [['src', './src']],
                extensions: ['.jsx', '.js', '.scss'],
            },
        },
    },
    overrides: [
        {
            files: ['*.spec.js', '*.spec.jsx'],
            rules: {
                'no-unused-expressions': 0,
            },
        },
    ],
    rules: {
        'react/jsx-curly-brace-presence': 'off',
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'react/jsx-wrap-multilines': 'off',
        'react/destructuring-assignment': 'off',
        'react/forbid-prop-types': 'off',
        'import/no-unresolved': [
            'error',
            {
                ignore: ['^~contracts/'],
            },
        ],
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'no-param-reassign': 'off',
        'no-console': 'off',
    },
};
