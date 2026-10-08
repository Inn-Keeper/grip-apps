// Babel config is inlined (configFile: false) on purpose: a babel.config file
// in this package could leak into Metro/Vite transforms of the same sources.
module.exports = {
  testEnvironment: "node",
  // The repo lives on an exFAT drive; macOS AppleDouble "._*" files would
  // otherwise be collected as (broken) test suites.
  testPathIgnorePatterns: ["/node_modules/", "/\\._"],
  moduleFileExtensions: ["js", "ts", "json"],
  transform: {
    "^.+\\.[jt]s$": [
      "babel-jest",
      {
        configFile: false,
        babelrc: false,
        presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
      },
    ],
  },
};
