#!/usr/bin/env node

const { build } = require('esbuild')
const pkg = require('./package.json')

const options = [
  {
    format: 'cjs',
    outfile: pkg.main
  },
  {
    format: 'esm',
    outfile: pkg.module
  }
]

;(async () => {
  await Promise.all(
    options.map(option =>
      build({
        bundle: true,
        color: true,
        entryPoints: ['src/index.ts'],
        external: [...Object.keys(pkg.dependencies)],
        logLevel: 'info',
        platform: 'node',
        write: true,
        ...option
      })
    )
  )
})()
