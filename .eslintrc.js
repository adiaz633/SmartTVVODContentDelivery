/*eslint-env node */

const fs = require("fs");
const path = require("path");

let opts = {};
const filename = path.resolve(__dirname, "user.eslint.js");
if (fs.existsSync(filename)) {
  opts = require(filename);
}

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@tad/eslint-config", "eslint:recommended", "plugin:prettier/recommended"],
  ...opts,
};
