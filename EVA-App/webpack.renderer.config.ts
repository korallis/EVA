/**
 * EVA Desktop Webpack Renderer Configuration
 * 
 * Optimized configuration for production builds with tree shaking,
 * code splitting, and bundle analysis capabilities.
 * 
 * @author EVA Development Team
 */

import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  optimization: {
    // Enable tree shaking for smaller bundles
    usedExports: true,
    sideEffects: false,
    
    // Code splitting for better performance
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      cacheGroups: {
        // Vendor chunks for third-party libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          maxSize: 500000,
        },
        // React and related libraries in separate chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
          maxSize: 300000,
        },
        // EVA services in separate chunks
        services: {
          test: /[\\/]src[\\/]services[\\/]/,
          name: 'eva-services',
          chunks: 'all',
          priority: 15,
          maxSize: 200000,
        },
        // Components in separate chunks
        components: {
          test: /[\\/]src[\\/]renderer[\\/]components[\\/]/,
          name: 'eva-components',
          chunks: 'all',
          priority: 12,
          maxSize: 150000,
        },
      },
    },
  },
  
  // Performance monitoring - adjusted for Electron desktop app
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 6000000, // 6MB for Electron (desktop apps can be larger)
    maxAssetSize: 3000000, // 3MB for individual assets
  },
};
