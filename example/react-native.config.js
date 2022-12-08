/**
 * Prevents automatically adding all `react-native-vector-icons` fonts to the app bundle
 * See https://github.com/oblador/react-native-vector-icons#ios
 */
module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
};
