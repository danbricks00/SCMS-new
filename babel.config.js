module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove the deprecated plugin
      // 'expo-router/babel',
      'react-native-reanimated/plugin'
    ],
  };
};