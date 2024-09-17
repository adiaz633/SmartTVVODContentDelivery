/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  //  Default: The root of the directory containing your Jest config file or the
  //  package.json
  rootDir: process.cwd(),

  //  Automatically clear mock calls, instances, contexts and results before
  //  every test
  clearMocks: true,

  //  Indicates whether the coverage information should be collected while
  //  executing the test
  collectCoverage: true,

  //  An array of glob patterns indicating a set of files for which coverage
  //  information should be collected
  collectCoverageFrom: [
    "src/new/managers/3pa-mng/**/*.js",
    "src/new/managers/enablers-mng/**/*.js",
    "src/new/managers/view-mng/**/*.js",
    "src/new/managers/user-data-mng.js",
    "config/loaders/conditional-loader/**/*.js",
  ],

  //  A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["text", "html"],

  //  An array of directory names to be searched recursively up from the
  //  requiring module's location
  moduleDirectories: ["node_modules", "<rootDir>"],

  //  The test environment that will be used for testing
  testEnvironment: "jest-environment-jsdom",

  //  A map from regular expressions to module names or to arrays of module names
  //  that allow to stub out resources with a single module
  moduleNameMapper: {
    "^.+\\.css$": "<rootDir>/__tests__/__mocks__/identity-mock.js",
    "^.+\\.svg$": "<rootDir>/__tests__/__mocks__/identity-mock.js",
    "^@tvMain$": "<rootDir>/src/tizenlib/Main.js",
    "^@appConfig$": "<rootDir>/src/config.js",
    "^@newPath/(.*)$": "<rootDir>/src/new/$1",
    "^@unirlib/(.*)$": "<rootDir>/src/unirlib/$1",
    "^@tvlib/(.*)$": "<rootDir>/src/tizenlib/$1",
    "^@locales/(.*)$": "<rootDir>/src/locales/$1",
    "^@vendorPath/(.*)$": "<rootDir>/vendor/$1",
  },

  // A list of paths to modules that run some code to configure or set up the
  // testing framework before each test file in the suite is executed
  setupFilesAfterEnv: ["<rootDir>/config/jest.setup.js"],

  //  The glob patterns Jest uses to detect test files
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[tj]s?(x)", "**/config/loaders/**/?(*.)+(spec|test).[tj]s?(x)"],

  //  An array of regexp pattern strings that are matched against all test paths
  //  before executing the test. If the test path matches any of the patterns,
  //  it will be skipped.
  testPathIgnorePatterns: ["<rootDir>/node_modules", "__mocks__"],
};
