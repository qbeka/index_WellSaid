const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, "app");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const mobileModules = path.resolve(projectRoot, "node_modules");

const forceMobileResolution = [
  "react",
  "react-native",
  "react-native-screens",
  "react-native-safe-area-context",
  "react-native-svg",
  "react-native-reanimated",
  "react-native-gesture-handler",
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    forceMobileResolution.some(
      (m) => moduleName === m || moduleName.startsWith(m + "/")
    )
  ) {
    const resolved = require.resolve(moduleName, { paths: [mobileModules] });
    return { type: "sourceFile", filePath: resolved };
  }
  return context.resolveRequest(
    { ...context, resolveRequest: undefined },
    moduleName,
    platform
  );
};

module.exports = config;
