module.exports = {
    extends: 'airbnb',
    parser: 'babel-eslint',
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
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
            'babel-module': {},
            alias: {
                map: [['src', './src']],
                extensions: ['.jsx', '.js', '.scss'],
            },
        },
    },
    rules: {
        // react
        'react/jsx-indent': ['error', 2],
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/react-in-jsx-scope': 'error',
        'react/jsx-indent-props': ['error', 2],
        'react/jsx-closing-bracket-location': 'error',
        'react/jsx-no-bind': 'error',
        'react/jsx-boolean-value': 'error',
        'react/forbid-prop-types': 0,
        'react/jsx-first-prop-new-line': ['error', 'multiline-multiprop'],
        'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
        'react/no-unused-prop-types': ['error', { skipShapeProps: true }],

        // import
        'import/named': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-named-as-default': 0,
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],

        // jsx-a11y
        'jsx-a11y/no-static-element-interactions': 0,
        'jsx-a11y/click-events-have-key-events': 0,
        'jsx-a11y/label-has-for': 0,

        // spacing
        indent: [
            'error',
            2,
            {
                SwitchCase: 1,
            },
        ],
        'no-tabs': 'error',
        'eol-last': ['error', 'always'],
        'linebreak-style': ['error', 'unix'],
        'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
        'no-trailing-spaces': 'error',
        'brace-style': 'error',
        'keyword-spacing': 'error',
        'key-spacing': 'error',
        'space-infix-ops': 'error',
        'space-in-parens': 'error',
        'space-before-blocks': 'error',
        'array-bracket-spacing': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'object-curly-newline': [
            'error',
            {
                ObjectExpression: { multiline: true, minProperties: 1 },
                ObjectPattern: { multiline: true, minProperties: 1 },
                ImportDeclaration: { multiline: true, minProperties: 1 },
                ExportDeclaration: { multiline: true, minProperties: 1 },
            },
        ],
        'object-property-newline': 'error',
        'no-whitespace-before-property': 'error',
        'arrow-body-style': ['error', 'as-needed'],
        'implicit-arrow-linebreak': 'off',
        'padded-blocks': ['error', 'never'],
        'generator-star-spacing': 'error',
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always',
            },
        ],
        'operator-linebreak': ['error', 'before'],
        'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],

        // syntax
        semi: ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'comma-style': ['error', 'last'],
        'no-nested-ternary': 0,
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'new-cap': 'error',

        // variables
        'no-var': 'error',
        'prefer-const': 'error',
        'one-var': ['error', 'never'],
        'no-unused-vars': [
            'error',
            {
                varsIgnorePattern: 'should|expect',
            },
        ],
        'no-underscore-dangle': ['error', { allow: ['_id'] }],
        'no-unneeded-ternary': 'error',
        eqeqeq: ['error', 'smart'],

        // string
        'prefer-template': 'error',
        'template-curly-spacing': 'error',
        quotes: ['error', 'single', { avoidEscape: true }],
        'max-len': [
            'warn',
            100,
            2,
            {
                ignoreComments: true,
                ignoreTrailingComments: true,
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true,
            },
        ],
        'no-useless-escape': 'error',

        // scope
        'block-scoped-var': 'error',
        'consistent-return': 0,
        'no-else-return': 'error',
        'default-case': 'error',
        'no-case-declarations': 'error',
    },
    overrides: [
        {
            files: ['*.spec.js', '*.spec.jsx'],
            rules: {
                'no-unused-expressions': 0,
            },
        },
    ],
};
