import { Options } from './require'
import { ImportOptions } from './import'

export function generateOptions(options: string | ImportOptions): ImportOptions
export function generateOptions(options: string | Options): Options

export function generateOptions(options: string | Options): Options {
  return typeof options === 'string' ? { code: options } : options
}
