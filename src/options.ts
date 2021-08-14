import type { Options as TransformOptions } from '@swc/core'

export interface Options {
  dirPath?: string
  globals?: Record<string, unknown>
}

export interface ImportOptions extends Options {
  transformOptions?: TransformOptions
}

export const getDefaultTransformOptions = (
  transformOptions?: TransformOptions
): TransformOptions => {
  return {
    ...transformOptions,
    jsc: {
      target: 'es2019',
      ...transformOptions?.jsc
    }
  }
}

export const getCommonjsTransformOptions = (
  transformOptions?: TransformOptions
): TransformOptions => {
  return {
    ...getDefaultTransformOptions(transformOptions),
    module: {
      type: 'commonjs',
      ...transformOptions?.module
    }
  }
}
