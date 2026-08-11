
const path = require("path");
const webpack = require("webpack");

function envString(name, fallback = "") {
  const value = process.env[name];
  if (value == null || String(value).trim() === "") {
    return fallback;
  }
  return String(value);
}

// Inject Datadog browser env at build time (export vars or use a local .env loader).
const datadogDefines = {
  "process.env.DD_APPLICATION_ID": JSON.stringify(envString("DD_APPLICATION_ID") || envString("REACT_APP_DD_APPLICATION_ID")),
  "process.env.DD_CLIENT_TOKEN": JSON.stringify(envString("DD_CLIENT_TOKEN") || envString("REACT_APP_DD_CLIENT_TOKEN")),
  "process.env.DD_SITE": JSON.stringify(envString("DD_SITE") || envString("REACT_APP_DD_SITE", "us5.datadoghq.com")),
  "process.env.DD_SERVICE": JSON.stringify(envString("DD_SERVICE") || envString("REACT_APP_DD_SERVICE", "adobe-demo")),
  "process.env.DD_ENV": JSON.stringify(envString("DD_ENV") || envString("REACT_APP_DD_ENV", "dev")),
  "process.env.DD_VERSION": JSON.stringify(envString("DD_VERSION") || envString("REACT_APP_DD_VERSION", "1.0.0")),
  "process.env.DD_SESSION_SAMPLE_RATE": JSON.stringify(envString("DD_SESSION_SAMPLE_RATE") || envString("REACT_APP_DD_SESSION_SAMPLE_RATE", "100")),
  "process.env.DD_RUM_ENABLED": JSON.stringify(envString("DD_RUM_ENABLED") || envString("REACT_APP_DD_RUM_ENABLED", "true")),
  "process.env.REACT_APP_DD_APPLICATION_ID": JSON.stringify(envString("REACT_APP_DD_APPLICATION_ID") || envString("DD_APPLICATION_ID")),
  "process.env.REACT_APP_DD_CLIENT_TOKEN": JSON.stringify(envString("REACT_APP_DD_CLIENT_TOKEN") || envString("DD_CLIENT_TOKEN")),
  "process.env.REACT_APP_DD_SITE": JSON.stringify(envString("REACT_APP_DD_SITE") || envString("DD_SITE", "us5.datadoghq.com")),
  "process.env.REACT_APP_DD_SERVICE": JSON.stringify(envString("REACT_APP_DD_SERVICE") || envString("DD_SERVICE", "adobe-demo")),
  "process.env.REACT_APP_DD_ENV": JSON.stringify(envString("REACT_APP_DD_ENV") || envString("DD_ENV", "dev")),
  "process.env.REACT_APP_DD_VERSION": JSON.stringify(envString("REACT_APP_DD_VERSION") || envString("DD_VERSION", "1.0.0")),
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
};

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: { presets: ["@babel/env"] }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist/"),
    publicPath: "/dist/",
    filename: "bundle.js"
  },
  devServer: {
    contentBase: path.join(__dirname, "public/"),
    port: 3000,
    publicPath: "http://localhost:3000/dist/",
    hotOnly: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin(datadogDefines)
  ]
};
