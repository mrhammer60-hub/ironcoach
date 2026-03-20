const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      extensions: ['.ts', '.js', '.json'],
      symlinks: true,
    },
    module: {
      ...options.module,
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                allowTsInNodeModules: true,
              },
            },
          ],
          // Include workspace packages
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, '../../packages/shared'),
            path.resolve(__dirname, '../../packages/config'),
            path.resolve(__dirname, '../../packages/db'),
          ],
        },
      ],
    },
  };
};
