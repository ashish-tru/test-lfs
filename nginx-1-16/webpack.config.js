const WebpackObfuscator = require('webpack-obfuscator');
const path = require('path');

const config = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  node: { __dirname: false },
  entry: './src/index.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  externals: ['@stackabl/core','@stackabl/core/shared/dependencies'],

  mode: 'production',

  // devtool: 'source-map',

  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.build.json'),
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true,
    }),
  ],
};

module.exports = config;
