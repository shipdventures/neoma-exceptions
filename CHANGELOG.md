# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/shipdventures/neoma-exception-handling/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/shipdventures/neoma-exception-handling/releases/tag/v0.1.0