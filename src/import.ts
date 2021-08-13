import { TransformOptions, transform, transformSync } from 'esbuild'
import { Options, requireFromString } from './require'

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const importFromString = async (
  code: string,
  options: ImportOptions = {}
): Promise<any> => {
  const { dirPath, globals, transformOptions = {} } = options

  const transformResult = await transform(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformResult.code, { dirPath, globals })
}

export const importFromStringSync = (
  code: string,
  options: ImportOptions = {}
): any => {
  const { dirPath, globals, transformOptions = {} } = options

  const transformResult = transformSync(code, {
    format: 'cjs',
    ...transformOptions
  })

  return requireFromString(transformResult.code, { dirPath, globals })
}
