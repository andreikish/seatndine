const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
  '@': __dirname,
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-qrcode-svg/textEncodingTransformation")
};

config.watchFolders = [
  __dirname,
  ...config.watchFolders,
];

config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  'mjs',
];

config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'ttf',
  'otf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
];

module.exports = config; 