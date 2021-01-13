const path = require("path");

module.exports = {
  devtool: 'eval-source-map',
  context: path.join(__dirname, "src"),
  entry: ["./main.js"],
  output: {
    path: path.join(__dirname, "www"),
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, "www"),
    port: 3000,
    historyApiFallback: true,
  }
};
