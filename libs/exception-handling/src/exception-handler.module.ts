import { Module } from "@nestjs/common"
import { NeomaExceptionFilter } from "./filters/exception.filter"
import { APP_FILTER } from "@nestjs/core"

/**
 * Global exception handling module for NestJS applications.
 *
 * Registers a global exception filter that provides:
 * - Intelligent logging based on HTTP status codes
 * - Consistent JSON error responses
 * - Automatic handling of all exceptions (HTTP and unhandled)
 * - Support for request-scoped loggers via `req.logger`
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
 * Once imported, all exceptions thrown in your application will be
 * automatically caught and handled with appropriate logging levels:
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
 * @see NeomaExceptionFilter for detailed logging behavior
 */
@Module({
  providers: [{ provide: APP_FILTER, useClass: NeomaExceptionFilter }],
  exports: [],
})
export class ExceptionHandlerModule {}
