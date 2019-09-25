module.exports = {
    // By default, babel assums all files are ES modules and use import to insert them.
    // However, webpack doesn't allow import to be mixed with module.exports,
    // which will cause this error:
    //     Cannot assign to read only property 'exports' of object '#<Object>'
    // So here we define sourceType = 'unambiguous' to tell babel to guess the file type.
    //
    // TODO - change sourceType to be 'module' (default value)
    // This will require all files to use import/export
    // and enforce babel to parse the files using the ECMAScript Module grammar.
    // Under this mode, files are automatically strict and less likely to pollute global scope.
    sourceType: 'unambiguous',
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-proposal-object-rest-spread'],
};
