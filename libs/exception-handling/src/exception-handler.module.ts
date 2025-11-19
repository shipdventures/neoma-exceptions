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
 */
@Module({
  providers: [{ provide: APP_FILTER, useClass: NeomaExceptionFilter }],
  exports: [],
})
export class ExceptionHandlerModule {}
