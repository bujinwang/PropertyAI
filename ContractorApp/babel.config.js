module.exports = function (api) {
  api.cache(true);

  // Jest runs the transform workers with JEST_WORKER_ID / NODE_ENV=test set.
  // In that environment the Reanimated worklet plugin must be skipped: both the
  // explicit entry below AND `babel-preset-expo`'s automatic injection eagerly
  // `require('react-native-reanimated/plugin')`, which in turn requires
  // `react-native-worklets/plugin` — a package that is not installed here and
  // is not needed to render components under test.
  // Outside of tests the preset options and plugin list are unchanged from the
  // app's original configuration.
  const isTest =
    !!process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';

  const plugins = [];

  if (!isTest) {
    plugins.push('react-native-reanimated/plugin');
  }

  plugins.push([
    'module-resolver',
    {
      alias: {
        '@': './src',
      },
    },
  ]);

  return {
    presets: [['babel-preset-expo', isTest ? { reanimated: false } : {}]],
    plugins,
  };
};
