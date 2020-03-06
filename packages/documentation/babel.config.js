module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {

        browsers: ['last 2 versions'],
      },
    }],
    '@babel/preset-react',
  ],
  plugins: [
    ['@babel/transform-runtime', {
      regenerator: true,
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
};
