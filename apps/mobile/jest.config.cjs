const expoPreset = require("jest-expo/jest-preset");

module.exports = {
  ...expoPreset,
  setupFiles: [],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "node",
  moduleNameMapper: {
    ...(expoPreset.moduleNameMapper || {}),
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@grip/core/(.*)$": "<rootDir>/../../packages/core/src/$1.js",
  },
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "(^|/)\\._"],
  transformIgnorePatterns: expoPreset.transformIgnorePatterns,
};
