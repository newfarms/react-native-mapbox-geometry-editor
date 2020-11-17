module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-paper/babel',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ],
};
