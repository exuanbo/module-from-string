import esbuild from 'rollup-plugin-esbuild-transform'
import dts from 'rollup-plugin-dts'
import pkg from './package.json'

const builtins = ['module', 'path', 'url', 'vm']
const dependencies = [...Object.keys(pkg.dependencies), 'nanoid/async']

const external = [...builtins, ...dependencies]

export default [
  {
    external,
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        generatedCode: 'es2015'
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
    external,
    input: '.cache/index.d.ts',
    output: {
      file: pkg.types,
      format: 'es'
    },
    plugins: [dts()]
  }
]
