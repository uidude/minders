const TOOLKIT_PACKGE = require("../../npe-toolkit/shell/latest/package.json");
const TOOLKIT_DEPS = {};

for (const key in TOOLKIT_PACKGE.dependencies) {
  TOOLKIT_DEPS[key] = {};
}

module.exports = {
  dependencies: TOOLKIT_DEPS
};