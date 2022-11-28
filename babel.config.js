module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    ['@babel/preset-typescript', { allowDeclareFields: true }],
  ],
  plugins: [
    'react-native-paper/babel',
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    ['@babel/plugin-proposal-class-properties'],
  ],
};
