import path from 'path'
import { formatMessages, transform } from 'esbuild'
import pkg from './package.json'

export default {
  external: ['module', 'path', 'url', 'vm', ...Object.keys(pkg.dependencies)],
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
    {
      name: 'esbuild',
      resolveId(source, importer) {
        return source.startsWith('.') ? path.resolve(path.dirname(importer), `${source}.ts`) : null
      },
      async transform(code, id) {
        const {
          code: transformedCode,
          map,
          warnings
        } = await transform(code, {
          format: 'esm',
          loader: 'ts',
          sourcefile: id,
          sourcemap: true,
          target: 'es2019'
        })
        if (warnings.length > 0) {
          ;(
            await formatMessages(warnings, {
              kind: 'warning',
              color: true
            })
          ).forEach(message => this.warn(message))
        }
        return {
          code: transformedCode,
          map
        }
      },
      renderDynamicImport() {
        return {
          left: 'import(',
          right: ')'
        }
      }
    }
  ]
}
