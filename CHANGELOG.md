# Changelog

## Unreleased

### Bug Fixes

- `import.meta.url` is incorrectly set to path instead of URL string in `importFromString`.

## [3.1.3](https://github.com/exuanbo/module-from-string/compare/v3.1.2...v3.1.3) (2021-11-27)

### Bug Fixes

- Absolute path import on Windows such as `C:\foo` could not be resolved.

### Chores

- Bump dependencies.

## [3.1.2](https://github.com/exuanbo/module-from-string/compare/v3.1.1...v3.1.2) (2021-11-07)

### Chores

- Bump and unpin dependencies.

## [3.1.1](https://github.com/exuanbo/module-from-string/compare/v3.1.0...v3.1.1) (2021-08-28)

### Bug Fixes

- In the previous versions when using `import` statement and dynamic `import()` expression, the specifier would not be resolved correctly if used on Windows and the path starts with posix path separator.

### Chores

- Bump dependency `esbuild` from 0.12.22 to 0.12.24

## [3.1.0](https://github.com/exuanbo/module-from-string/compare/v3.0.1...v3.1.0) (2021-08-21)

### Bug Fixes

- Fix problem when using `import` statement of ES modules.

### Features

- Add new optional option `dirname` to specify the directory path for resolving relative path `require` or `import`.
- Add support for dynamic import() expression.
