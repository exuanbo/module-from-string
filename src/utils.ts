import { Options } from './require'
import { ImportOptions } from './import'

export const generateOptions = (
  options: string | Options | ImportOptions
): ImportOptions => (typeof options === 'string' ? { code: options } : options)
