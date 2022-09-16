# Changelog

## [3.3.0](https://github.com/exuanbo/module-from-string/compare/v3.2.1...v3.3.0) (2022-09-16)

### Features

- Add option `filename` for better exception stack trace.

## [3.2.1](https://github.com/exuanbo/module-from-string/compare/v3.2.0...v3.2.1) (2022-08-02)

### Bug Fixes

- File URL was incorrectly converted to path in `import()` expression.
- Error when using import statement with absolute path on Windows.

## [3.2.0](https://github.com/exuanbo/module-from-string/compare/v3.1.4...v3.2.0) (2022-07-17)

### Features

- Add option `useCurrentGlobal` to pass all the available variable from the current `global` (or `globalThis`) into the context.
- Add curried functions `createRequireFromString`, `createImportFromString` and `createImportFromStringSync`.

## [3.1.4](https://github.com/exuanbo/module-from-string/compare/v3.1.3...v3.1.4) (2021-12-23)

### Bug Fixes

- `import.meta.url` is incorrectly set to path instead of URL string in `importFromString`.

### Chores

- Bump dependencies. Note that [esbuild 0.14.4](https://github.com/evanw/esbuild/releases/tag/v0.14.4) adjusted its handling of `default` exports and the `__esModule` marker to improve compatibility with Webpack and Node, which may cause some changes when transforming the code from ES modules to CommonJS modules.

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
