const path = require('path');
const pak = require('../package.json');

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      'module:metro-react-native-babel-preset',
      ['@babel/preset-typescript', { allowDeclareFields: true }],
    ],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json'],
          alias: {
            // For development, we want to alias the library to the source
            [pak.name]: path.join(__dirname, '..', pak.source),
          },
        },
      ],
      ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
      ['@babel/plugin-transform-flow-strip-types'], // From https://github.com/facebook/react-native/issues/29084#issuecomment-1148014199
      ['@babel/plugin-proposal-class-properties'],
    ],
  };
};
