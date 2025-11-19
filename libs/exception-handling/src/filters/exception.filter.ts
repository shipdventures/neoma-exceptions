import {
  ArgumentsHost,
  Catch,
  ConsoleLogger,
  ExceptionFilter,
  HttpStatus,
  Logger,
  LoggerService,
} from "@nestjs/common"

class LoggerWrapper {
  public constructor(private readonly logger: LoggerService) {}

  public error(err: Error, message: string): void {
    if (
      this.logger["staticInstanceRef"] &&
      this.logger["staticInstanceRef"] instanceof ConsoleLogger
    ) {
      this.logger.error!(err, message, "NeomaExceptionFilter")
    } else {
      this.logger.error!(message, {
        err,
      })
    }
  }

  public warn(err: Error, message: string): void {
    if (
      this.logger["staticInstanceRef"] &&
      this.logger["staticInstanceRef"] instanceof ConsoleLogger
    ) {
      this.logger.warn!(err, message, "NeomaExceptionFilter")
    } else {
      this.logger.warn!(message, {
        err,
      })
    }
  }

  public debug(err: Error, message: string): void {
    if (
      this.logger["staticInstanceRef"] &&
      this.logger["staticInstanceRef"] instanceof ConsoleLogger
    ) {
      this.logger.debug!(err, message, "NeomaExceptionFilter")
    } else {
      this.logger.debug!(message, {
        err,
      })
    }
  }
}

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
 * ## Logger Selection
 *
 * The filter selects a logger in the following priority order:
 *
 * 1. **Request logger (`req.logger`)** - If the request has a `logger` property,
 *    it will be used. This enables request-scoped logging with correlation IDs.
 * 2. **Overridden NestJS Logger** - If `Logger.overrideLogger()` was called with
 *    a custom implementation, that logger is used.
 * 3. **Default NestJS Logger** - Falls back to the built-in ConsoleLogger.
 *
 * For structured loggers (Pino, Winston, Bunyan), logs are formatted as:
 * ```typescript
 * logger.error(message, { err })
 * ```
 *
 * For the default ConsoleLogger, the original NestJS format is preserved:
 * ```typescript
 * Logger.error(err, message, 'NeomaExceptionFilter')
 * ```
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
    err: Error & {
      getStatus?: () => HttpStatus
      getResponse?: () => any
    },
    host: ArgumentsHost,
  ): void {
    const request = host.switchToHttp().getRequest()
    const response = host.switchToHttp().getResponse()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const logger = new LoggerWrapper(request.logger || Logger)

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
      logger.debug(
        err,
        `[${err.getStatus!()}] Resource not found - ${err.name}`,
      )
    } else if (err.getStatus!() < HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.warn(err, `[${err.getStatus!()}] Request rejected - ${err.name}`)
    } else {
      logger.error(err, `[${err.getStatus!()}] Request failed - ${err.name}`)
    }

    response.status(err.getStatus!()).json(err.getResponse!())
  }
}
