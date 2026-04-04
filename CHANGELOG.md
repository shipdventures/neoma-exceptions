# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Exception-level redirect support via `getRedirect()` on `NeomaException` — when an exception returns `{ status, url }` and the request accepts HTML, the filter redirects instead of rendering or returning JSON

## [0.6.0] - 2026-04-02

### Added
- Redirect support in `@ErrorTemplate` — template values starting with `/` trigger a `303 See Other` redirect instead of rendering

## [0.5.0] - 2026-04-01

### Added
- Optional `locals` parameter on `@ErrorTemplate` for passing static, per-route variables to templates (available as `errorTemplateLocals` in the render context)

## [0.4.0] - 2026-03-31

### Added
- `@ErrorTemplate` decorator for HTML error rendering via content negotiation
- `ErrorTemplateInterceptor` to bridge route metadata to the exception filter
- `ERROR_TEMPLATE_KEY` constant for shared metadata key
- `validationFactory` for field-keyed validation error responses
- Global `ValidationPipe` registration with the validation factory
- Content negotiation in `NeomaExceptionFilter` — renders templates when the request accepts `text/html` and an error template is set, otherwise returns JSON
- Debug logging when rendering error templates
- `class-validator` and `class-transformer` as peer dependencies

### Changed
- `ExceptionHandlerModule` now registers `APP_PIPE` (ValidationPipe) and `APP_INTERCEPTOR` (ErrorTemplateInterceptor) in addition to `APP_FILTER`
- Express response fixture now merges custom locals with defaults instead of replacing them

## [0.3.0] - 2025-12-03

### Added
- `NeomaException` interface for creating self-contained custom exceptions
- `log(logger)` method support for custom logging behavior
- Ability to disable logging entirely via empty `log()` implementation

## [0.2.0] - 2025-12-03

### Added
- Flexible logger selection with priority: `req.logger` → overridden Logger → default ConsoleLogger
- Request-scoped logging support via `req.logger` for correlation IDs and request context
- Structured log format `(message, { err })` for Pino, Winston, Bunyan
- Original NestJS format `(err, message, context)` preserved for ConsoleLogger
- MockLoggerService fixture for testing
- Express fixture updated to support arbitrary request properties

## [0.1.0] - 2025-12-03

### Added
- `ExceptionHandlerModule` for zero-config global exception handling
- `NeomaExceptionFilter` with intelligent logging based on HTTP status code
  - 404s logged at DEBUG level (expected in normal operation)
  - 4xx errors logged at WARN level (client issues)
  - 5xx errors logged at ERROR level (server problems)
  - Unhandled exceptions logged at ERROR level
- Consistent JSON error responses for all exceptions
- Duck-typed exception support - any object implementing `getStatus()` and `getResponse()` methods is handled automatically

[Unreleased]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/shipdventures/neoma-exception-handling/releases/tag/v0.1.0