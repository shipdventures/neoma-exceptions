import { Module } from "@nestjs/common"
import { NeomaExceptionFilter } from "./filters/exception.filter"
import { APP_FILTER } from "@nestjs/core"

/**
 * Global exception handling module for NestJS applications.
 *
 * A drop-in replacement for NestJS's built-in exception handling with
 * zero configuration required. Provides:
 * - Intelligent logging based on HTTP status codes
 * - Consistent JSON error responses
 * - Automatic handling of all exceptions (HTTP and unhandled)
 * - Support for request-scoped loggers via `req.logger`
 * - Custom exception behavior via the {@link NeomaException} interface
 *
 * @example
 * ```typescript
 * import { Module } from '@nestjs/common'
 * import { ExceptionHandlerModule } from '@neoma/exception-handling'
 *
 * @Module({
 *   imports: [ExceptionHandlerModule],
 * })
 * export class AppModule {}
 * ```
 *
 * Once imported, all exceptions are automatically caught and handled.
 *
 * ## Default Logging Levels
 *
 * - 404 errors: DEBUG level
 * - 4xx errors: WARN level
 * - 5xx errors: ERROR level
 * - Unhandled exceptions: ERROR level
 *
 * ## Logger Selection
 *
 * The filter uses the first available logger:
 * 1. `req.logger` - Request-scoped logger (if attached to the request)
 * 2. Overridden NestJS Logger - Via `Logger.overrideLogger()`
 * 3. Default NestJS ConsoleLogger
 *
 * ## Custom Exceptions
 *
 * Implement the {@link NeomaException} interface for full control over
 * status codes, responses, and logging behavior. All methods are optional.
 *
 * @see NeomaException for the custom exception interface
 * @see NeomaExceptionFilter for detailed behavior
 */
@Module({
  providers: [{ provide: APP_FILTER, useClass: NeomaExceptionFilter }],
  exports: [],
})
export class ExceptionHandlerModule {}
