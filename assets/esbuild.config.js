const esbuild = require('esbuild');
const path = require('path');

const buildOptions = {
  entryPoints: ['./js/phoenix_live_react.js'],
  outfile: path.resolve(__dirname, '../priv/static/phoenix_live_react.js'),
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2017'],
  loader: {
    '.js': 'jsx',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  external: ['react', 'react-dom'],
};

// Check if watch mode is enabled
const watchMode = process.argv.includes('--watch');

if (watchMode) {
  // Watch mode
  esbuild.build({
    ...buildOptions,
    watch: {
      onRebuild(error, result) {
        if (error) console.error('watch build failed:', error);
        else console.log('watch build succeeded:', result);
      },
    },
  }).then(result => {
    console.log('watching...');
  }).catch(() => process.exit(1));
} else {
  // Build once
  esbuild.build(buildOptions).catch(() => process.exit(1));
}