import { LoggerService } from "@nestjs/common"

/**
 * Interface for exceptions handled by NeomaExceptionFilter.
 *
 * All methods are optional. Implementing a method overrides the filter's
 * default behavior for that aspect. Not implementing a method uses the
 * Neoma default:
 *
 * | Method | Default when not implemented |
 * |--------|------------------------------|
 * | `getStatus()` | 500 Internal Server Error |
 * | `getResponse()` | Generic 500 JSON response |
 * | `log()` | Status-code-based logging (DEBUG/WARN/ERROR) |
 * | `getRedirect()` | No redirect (template or JSON response) |
 *
 * @example
 * ```typescript
 * import { HttpStatus, LoggerService } from '@nestjs/common'
 * import { NeomaException } from '@neoma/exception-handling'
 *
 * export class PaymentFailedException extends Error implements NeomaException {
 *   public constructor(
 *     private readonly transactionId: string,
 *     private readonly reason: string,
 *   ) {
 *     super(`Payment failed: ${reason}`)
 *     this.name = 'PaymentFailedException'
 *   }
 *
 *   public getStatus(): number {
 *     return HttpStatus.PAYMENT_REQUIRED
 *   }
 *
 *   public getResponse(): object {
 *     return {
 *       statusCode: HttpStatus.PAYMENT_REQUIRED,
 *       message: this.reason,
 *       error: 'Payment Required',
 *     }
 *   }
 *
 *   public log(logger: LoggerService): void {
 *     logger.error?.(`Payment failed for transaction ${this.transactionId}`, {
 *       transactionId: this.transactionId,
 *       reason: this.reason,
 *     })
 *   }
 * }
 * ```
 *
 * @example Disabling logging for an exception
 * ```typescript
 * export class ExpectedValidationException extends Error implements NeomaException {
 *   public getStatus(): number {
 *     return HttpStatus.UNPROCESSABLE_ENTITY
 *   }
 *
 *   public getResponse(): object {
 *     return { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, message: this.message, error: 'Validation Error' }
 *   }
 *
 *   // Implementing log() but leaving it empty disables logging entirely
 *   public log(): void {}
 * }
 * ```
 *
 * @see NeomaExceptionFilter for how exceptions are processed
 */
export interface NeomaException {
  /**
   * The exception name, used in log messages.
   */
  name: string

  /**
   * Returns the HTTP status code to send to the client.
   *
   * If not implemented, defaults to 500 Internal Server Error.
   *
   * @returns HTTP status code (e.g., 400, 404, 500)
   */
  getStatus?(): number

  /**
   * Returns the JSON response body to send to the client.
   *
   * If not implemented, defaults to:
   * ```json
   * { "statusCode": 500, "message": "Internal server error", "error": "Internal Server Error" }
   * ```
   *
   * @returns Object to be serialized as JSON response
   */
  getResponse?(): object

  /**
   * Custom logging handler called instead of default status-code-based logging.
   *
   * If not implemented, the filter logs based on status code:
   * - 404: DEBUG level
   * - 4xx: WARN level
   * - 5xx: ERROR level
   *
   * Implementing this method overrides that behavior entirely. The logger
   * will be either `req.logger` (if available) or the NestJS Logger.
   *
   * To disable logging for an exception, implement this method with an
   * empty body.
   *
   * @param logger - The LoggerService to use for logging
   */
  log?(logger: LoggerService): void

  /**
   * Returns a redirect instruction for the exception filter.
   *
   * When implemented and the request accepts `text/html`, the filter will
   * redirect the client instead of rendering a template or returning JSON.
   * This takes priority over `@ErrorTemplate`.
   *
   * If the return value is missing `url` or `status`, the filter logs a
   * warning and falls through to default handling.
   *
   * @returns An object with `status` (HTTP redirect status code, e.g. 302, 303)
   *          and `url` (the redirect target)
   *
   * @example
   * ```typescript
   * import { HttpStatus } from '@nestjs/common'
   *
   * export class UnauthenticatedException extends Error implements NeomaException {
   *   public getStatus(): number {
   *     return HttpStatus.UNAUTHORIZED
   *   }
   *
   *   public getRedirect(): { status: number; url: string } {
   *     return { status: HttpStatus.SEE_OTHER, url: '/login' }
   *   }
   * }
   * ```
   */
  getRedirect?(): { status: number; url: string }
}
