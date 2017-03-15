const express = require('express')
const path = require('path')
const { FuseBox } = require('fuse-box');
const fsbx = require('fuse-box');

const box = FuseBox
  .init({
    homeDir: './src',
    outFile: './build2/bundle.js',
    sourcemaps: true,
    alias: {
      'app': '~/app', // TODO: Just use ~
    },
    plugins: [
      fsbx.EnvPlugin({ NODE_ENV: process.argv[2] }),
      !process.argv.includes('dev') && fsbx.UglifyJSPlugin()
    ]
  })

if (process.argv.includes('dev')){
  const server = box.devServer('> app/index.tsx', {
    port: 5001,
  })
  server.httpServer.app.use(express.static(root('build2')))
  server.httpServer.app.get('*', function(req, res) {
      res.sendFile(root('build2', 'index.html'))
  })
} else {
  box.bundle('> build2/app.tsx')
}

function root(args) {
  args = Array.prototype.slice.call(arguments, 0)
  return path.join.apply(path, [__dirname].concat(args))
}
