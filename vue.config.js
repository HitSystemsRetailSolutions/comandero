const { defineConfig } = require("@vue/cli-service");
const packageJson = require("./package.json");
process.env.VUE_APP_VERSION = packageJson.version;
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 3001,
  },
});
