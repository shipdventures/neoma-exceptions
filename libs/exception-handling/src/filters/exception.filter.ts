import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common"

/**
 * Global exception filter that catches all exceptions and provides
 * intelligent logging based on HTTP status codes.
 *
 * ## Custom Exceptions
 *
 * This filter uses duck-typing to handle any exception that implements
 * `getStatus()` and `getResponse()` methods. You can create custom
 * exception classes without extending `HttpException`:
 *
 * @example
 * ```typescript
 * export class PaymentFailedException {
 *   public name = 'PaymentFailedException'
 *
 *   constructor(private message: string) {}
 *
 *   public getStatus(): number {
 *     return 402
 *   }
 *
 *   public getResponse(): object {
 *     return {
 *       statusCode: 402,
 *       message: this.message,
 *       error: 'Payment Required',
 *     }
 *   }
 * }
 * ```
 *
 * Exceptions without these methods are treated as 500 Internal Server Error.
 *
 * ## Logging Strategy
 *
 * Different log levels are used based on the error severity:
 *
 * | Status Code | Log Level | Rationale |
 * |-------------|-----------|-----------|
 * | 404 | DEBUG | Expected in normal operation (bots, typos) |
 * | 400-499 | WARN | Client errors worth monitoring |
 * | 500-599 | ERROR | Server errors needing immediate attention |
 * | Non-HTTP | ERROR | Unhandled exceptions, critical |
 *
 * ## Log Format
 *
 * Logs include the full error object with stack trace, formatted as:
 * ```
 * [STATUS] Action - ExceptionName
 * ```
 *
 * Examples:
 * - `[404] Resource not found - NotFoundException`
 * - `[400] Request rejected - BadRequestException`
 * - `[500] Request failed - InternalServerErrorException`
 * - `[500] Request failed - TypeError`
 *
 * ## Response Format
 *
 * For exceptions with `getResponse()`, returns that response directly.
 * For exceptions without, returns a generic 500 response:
 * ```json
 * {
 *   "statusCode": 500,
 *   "message": "Internal server error",
 *   "error": "Internal Server Error"
 * }
 * ```
 *
 * @see ExceptionHandlerModule for registration
 */
@Catch()
export class NeomaExceptionFilter implements ExceptionFilter {
  /**
   * Catches and handles all exceptions thrown in the application.
   *
   * Normalizes exceptions using duck-typing: if the exception has `getStatus()`
   * and `getResponse()` methods, those are used. Otherwise, defaults to a
   * 500 Internal Server Error response.
   *
   * Logs the exception at the appropriate level based on status code,
   * then sends the JSON response to the client.
   *
   * @param err - The caught exception. Can be any object with a `name` property.
   *              If it has `getStatus()` and `getResponse()` methods, they will be used.
   * @param host - The NestJS arguments host providing access to the request/response context.
   */
  public catch(
    err: {
      getStatus?: () => HttpStatus
      getResponse?: () => any
      name: string
    },
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse()

    if ("getStatus" in err === false) {
      err["getStatus"] = (): HttpStatus.INTERNAL_SERVER_ERROR =>
        HttpStatus.INTERNAL_SERVER_ERROR
    }

    if ("getResponse" in err === false) {
      err["getResponse"] = (): any => ({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
      })
    }

    if (err.getStatus!() === HttpStatus.NOT_FOUND) {
      Logger.debug(
        err,
        `[${err.getStatus!()}] Resource not found - ${err.name}`,
        "NeomaExceptionFilter",
      )
    } else if (err.getStatus!() < HttpStatus.INTERNAL_SERVER_ERROR) {
      Logger.warn(
        err,
        `[${err.getStatus!()}] Request rejected - ${err.name}`,
        "NeomaExceptionFilter",
      )
    } else {
      Logger.error(
        err,
        `[${err.getStatus!()}] Request failed - ${err.name}`,
        "NeomaExceptionFilter",
      )
    }

    response.status(err.getStatus!()).json(err.getResponse!())
  }
}
