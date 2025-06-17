import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import type IHtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin: typeof IHtmlWebpackPlugin = require('html-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    async: true, // Run asynchronously to prevent hanging
    typescript: {
      memoryLimit: 2048,
      configFile: 'tsconfig.json',
    },
  }),
  new HtmlWebpackPlugin({
    meta: {
      'Content-Security-Policy': {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self' data:; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob: https://images.evetech.net; " +
                "connect-src 'self' https://esi.evetech.net https://login.eveonline.com; " +
                "font-src 'self' data:; " +
                "frame-src 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self';"
      }
    }
  }),
  // Ignore optional AWS SDK dependencies
  new webpack.IgnorePlugin({
    resourceRegExp: /@aws-sdk\/(client-s3|lib-storage|s3-request-presigner)/,
  }),
];
