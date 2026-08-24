const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const reactPath = path.resolve(__dirname, 'node_modules/react');
const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: reactPath,
  'react-dom': reactDomPath,
};

config.transformer = config.transformer || {};
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native-vector-icons' ||
      moduleName.startsWith('react-native-vector-icons/')
    ) {
      return {
        filePath: path.resolve(__dirname, 'src/shims/react-native-vector-icons.web.js'),
        type: 'sourceFile',
      };
    }
    if (
      moduleName === 'react-native-maps' ||
      moduleName.startsWith('react-native-maps/')
    ) {
      return {
        filePath: path.resolve(__dirname, 'src/shims/react-native-maps.web.js'),
        type: 'sourceFile',
      };
    }
    if (
      moduleName === 'react-native-calendars' ||
      moduleName.startsWith('react-native-calendars/')
    ) {
      return {
        filePath: path.resolve(__dirname, 'src/shims/react-native-calendars.web.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName.startsWith('@react-native-firebase/')) {
      return {
        filePath: path.resolve(__dirname, 'src/shims/empty-module.js'),
        type: 'sourceFile',
      };
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
