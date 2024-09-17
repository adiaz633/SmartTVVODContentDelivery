const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const dotenv = require("dotenv");
const country = "es-es";
const crypt = require("../config/utils/utils");

function getSecrets(country) {
  let secretsPath = "../config/utils/secrets";
  if (fs.existsSync(path.resolve(__dirname, "../config/utils/secrets.dev.js"))) secretsPath += ".dev";
  return require(secretsPath)(country);
}

/** @type {import("webpack").Configuration} */
const webpackConfig = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    filename: "[name].bundle.js",
  },
  mode: "development",
  devServer: {
    compress: true,
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: "all",
    client: {
      overlay: true,
    },
  },
  devtool: "eval-cheap-module-source-map",
  resolve: {
    alias: {
      "@unirlib": path.resolve("./src/unirlib/"),
      "@newPath": path.resolve("./src/code/"),
      "@vendorPath": path.resolve("./vendor/"),
      "@appConfig": path.resolve("./src/config"),
      "@locales": path.resolve("./src/locales/"),
      "@svgImagesFolder": path.resolve("./src/images/svgs/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, , /lglib/, /exolib/, /hisenselib/, /tizenlib/, /web/],
        use: [
          {
            loader: "babel-loader", // transpiling our JavaScript files using Babel and webpack,
          },
          {
            loader: path.resolve(__dirname, "./loaders/replace-loader.js"),
          },
          {
            loader: path.resolve(__dirname, "./loaders/conditional-loader"),
          },
        ],
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          "style-loader", // creates style nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader", // compiles Sass to CSS, using Node Sass by default
        ],
      },
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: "asset/resource",
      },
      {
        test: /\.ejs\.html$/,
        use: {
          loader: path.resolve(__dirname, "./loaders/ejs-loader"),
        },
      },
      {
        test: /\.html$/,
        exclude: [/\.ejs\.html$/],
        use: {
          loader: "html-loader",
          options: {
            attrs: ["img:src", ":data-src"],
            minimize: true,
          },
        },
      },
    ],
  },
  optimization: {
    runtimeChunk: {
      name: "single",
    },
  },
  target: ["web", "es5"],
  plugins: [
    // CleanWebpackPlugin will do some clean up/remove folder before build
    // In this case, this plugin will remove 'dist' and 'build' folder before re-build again
    new CleanWebpackPlugin(),
    /**
     * IgnorePlugin will skip any require
     * that matches the following regex.
     */
    new webpack.IgnorePlugin({ resourceRegExp: /vertx/ }),

    /**
     * Ignore markdowns
     */
    new webpack.IgnorePlugin({ resourceRegExp: /\.md$/ }),

    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
  ],
};

module.exports = (env, argv) => {
  const { tvmodel } = argv.env || "";
  console.log(`webpack dev tvmodel=${tvmodel}`);

  // Cargar el .env local en el process.env para que se puedan
  // usar las variables de entorno en los cargadores sobre todo
  // la de los widgets. esto es solo para dev
  const localDotEnvPath = path.resolve(__dirname, `.env.${tvmodel}.local`);
  if (fs.existsSync(localDotEnvPath)) {
    dotenv.config({
      path: localDotEnvPath,
    });
  }

  let excludeArray = webpackConfig.module.rules[0].exclude;
  let htmlWebpackPluginConfig = {};
  const copyWebpackPluginConfig = {
    patterns: [
      { from: "src/app/htmls", to: "app/htmls" },
      { from: "src/app/styles", to: "app/styles" },
      { from: "src/images", to: "images" },
      { from: "src/fonts", to: "fonts" },
      { from: "src/favicon.ico", to: "." },
      { from: "src/terms-of-use3.json", to: "." },
      { from: "src/new/dev-tools/cache/fallbackCache.js", to: "." },
    ],
    options: {
      concurrency: 100,
    },
  };

  /*
  .env                # loaded in all cases
  .env.local          # loaded in all cases, ignored by git
  .env.[tvmodel]         # only loaded in specified mode
  .env.[tvmodel].local   # only loaded in specified mode, ignored by git
  */
  const globalEnvFile = path.resolve(`config/.env`);
  const localEnvFile = path.resolve(`config/.env.local`);
  const globalModelEnvFile = path.resolve(`config/.env.${tvmodel}`);
  const localModelEnvFile = path.resolve(`config/.env.${tvmodel}.local`);

  // Verifica si existe el fichero y en ese caso lo parsea. FlatMap es un filter + map
  const envFileArray = [globalEnvFile, localEnvFile, globalModelEnvFile, localModelEnvFile].flatMap((confFile) =>
    fs.existsSync(confFile) ? dotenv.parse(fs.readFileSync(confFile)) : []
  );

  const config = merge(envFileArray);
  const version = config.APP_VERSION;
  const milestone = "unir";
  config.DATE_VERSION = new Date().getTime();
  const secrets = getSecrets(country);
  config.SIGNATURE_CUSTOMER_KEY = JSON.stringify(
    crypt(secrets.consumerKey, version, milestone, config.DATE_VERSION, country)
  );
  config.SIGNATURE_KEY = JSON.stringify(
    crypt(secrets.consumerSecret, version, milestone, config.DATE_VERSION, country)
  );
  console.log(config);
  webpackConfig.plugins.push(
    new webpack.DefinePlugin({
      CONFIG_ENV: JSON.stringify(config),
    })
  );

  if (config.DISABLE_OVERLAY === "true") {
    console.info("** Webpack dev server: Overlay disabled");
    webpackConfig.devServer.client.overlay = false;
  }

  /* Tratamiento de cada dispositivo */
  if (tvmodel === "unir") {
    webpackConfig.resolve.alias["@tvlib"] = path.resolve("./src/tizenlib/");
    webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/tizenlib/Main");
    excludeArray = excludeArray.filter((item) => {
      return String(item) !== String(/boblib/);
    });
    htmlWebpackPluginConfig = {
      template: "./src/index_exo.html",
      filename: "index.html",
    };
  } else if (tvmodel === "lg") {
    webpackConfig.resolve.alias["@tvlib"] = path.resolve("./src/lglib/");
    webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/lglib/Main");
    excludeArray = excludeArray.filter((item) => {
      return String(item) !== String(/lglib/);
    });
    htmlWebpackPluginConfig = {
      template: "./src/index_LG.html",
      filename: "index.html",
    };
  } else if (tvmodel === "exo" || tvmodel === "fire") {
    webpackConfig.resolve.alias["@tvlib"] = path.resolve("./src/exolib/");
    webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/exolib/Main");
    excludeArray = excludeArray.filter((item) => {
      return String(item) !== String(/exolib/);
    });
    htmlWebpackPluginConfig = {
      template: "./src/index_exo.html",
      filename: "index.html",
    };
    copyWebpackPluginConfig.patterns.push({ from: "vendor/jsandroid", to: "vendor/jsandroid" });
  } else if (tvmodel === "tizen2015" || tvmodel === "tizen2016") {
    webpackConfig.resolve.alias["@tvlib"] = path.resolve("./src/tizenlib/");
    if (tvmodel === "tizen2015") {
      webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/tizenlib/Main2015");
    } else {
      webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/tizenlib/Main2016");
    }
    excludeArray = excludeArray.filter((item) => {
      return String(item) !== String(/tizenlib/);
    });
    htmlWebpackPluginConfig = {
      template: "./src/index_tizen.html",
      filename: "index.html",
    };
  } else if (tvmodel === "hisense") {
    webpackConfig.resolve.alias["@tvlib"] = path.resolve("./src/hisenselib/");
    webpackConfig.resolve.alias["@tvMain"] = path.resolve("./src/hisenselib/Main");
    excludeArray = excludeArray.filter((item) => {
      return String(item) !== String(/hisenselib/);
    });
    htmlWebpackPluginConfig = {
      template: "./src/index_hisense.html",
      filename: "index.html",
    };
  }
  webpackConfig.output.path = path.resolve(`./build/${tvmodel}`);
  webpackConfig.devServer.static = path.resolve(`./build/${tvmodel}`);
  webpackConfig.module.rules[0].exclude = excludeArray;

  webpackConfig.plugins.push(
    // Copy static files
    new CopyWebpackPlugin(copyWebpackPluginConfig)
  );

  webpackConfig.plugins.push(
    new HtmlWebpackPlugin(htmlWebpackPluginConfig)
  );


  return webpackConfig;
};
