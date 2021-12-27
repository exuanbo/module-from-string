import esbuild from 'rollup-plugin-esbuild-transform'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

export default [
  {
    external: ['module', 'path', 'url', 'vm', ...Object.keys(pkg.dependencies), 'nanoid/async'],
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs'
      },
      {
        file: pkg.module,
        format: 'es'
      }
    ],
    plugins: [
      esbuild([
        {
          loader: 'ts'
        },
        {
          output: true,
          target: 'node12.20.0'
        }
      ]),
      {
        name: 'dynamic-import',
        renderDynamicImport() {
          return {
            left: 'import(',
            right: ')'
          }
        }
      }
    ]
  },
  {
    input: '.cache/index.d.ts',
    output: {
      file: pkg.types,
      format: 'es'
    },
    plugins: [dts()]
  }
]
