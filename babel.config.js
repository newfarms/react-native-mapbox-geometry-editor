module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  plugins: [
    'react-native-paper/babel',
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ['@babel/plugin-transform-flow-strip-types'], // From https://github.com/facebook/react-native/issues/29084#issuecomment-1148014199
    ['@babel/plugin-proposal-class-properties'],
  ],
};
