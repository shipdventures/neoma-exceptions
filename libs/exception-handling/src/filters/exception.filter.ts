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
 * Works as a drop-in replacement for NestJS's built-in exception handling
 * with zero configuration required. Simply import `ExceptionHandlerModule`
 * and all exceptions are handled automatically.
 *
 * ## Custom Exceptions
 *
 * Implement the {@link NeomaException} interface to create custom exceptions
 * with full control over status, response, and logging. All methods are
 * optional - unimplemented methods use Neoma defaults:
 *
 * | Method | Default when not implemented |
 * |--------|------------------------------|
 * | `getStatus()` | 500 Internal Server Error |
 * | `getResponse()` | Generic 500 JSON response |
 * | `log()` | Status-code-based logging |
 *
 * @example
 * ```typescript
 * import { NeomaException } from '@neoma/exception-handling'
 *
 * export class PaymentFailedException extends Error implements NeomaException {
 *   constructor(private transactionId: string) {
 *     super('Payment failed')
 *     this.name = 'PaymentFailedException'
 *   }
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
 *
 *   public log(logger: LoggerService): void {
 *     logger.error?.('Payment failed', { transactionId: this.transactionId })
 *   }
 * }
 * ```
 *
 * ## Custom Logging
 *
 * Implement the `log(logger)` method to override default logging behavior.
 * The logger passed will be either `req.logger` (if available) or the
 * NestJS Logger. Implementing an empty `log()` method disables logging
 * for that exception entirely.
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
 * ## Default Logging Strategy
 *
 * When no `log()` method is implemented, the filter logs based on status code:
 *
 * | Status Code | Log Level | Rationale |
 * |-------------|-----------|-----------|
 * | 404 | DEBUG | Expected in normal operation (bots, typos) |
 * | 400-499 | WARN | Client errors worth monitoring |
 * | 500-599 | ERROR | Server errors needing immediate attention |
 * | Non-HTTP | ERROR | Unhandled exceptions, critical |
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
 * ## Content Negotiation
 *
 * When both conditions are met:
 * 1. The request `Accept` header includes `text/html`
 * 2. `res.locals.errorTemplate` is set (via the {@link ErrorTemplateInterceptor})
 *
 * The filter renders the template instead of returning JSON:
 * ```typescript
 * response.render(errorTemplate, { ...res.locals, exception: err.getResponse() })
 * ```
 *
 * Otherwise, the default JSON response is used. API applications are
 * completely unaffected.
 *
 * @see NeomaException for the interface to implement
 * @see ExceptionHandlerModule for registration
 * @see ErrorTemplate for the decorator that enables template rendering
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
   * then responds to the client — rendering an error template when the
   * request accepts HTML and an error template is set, or returning
   * JSON otherwise.
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

    if ("log" in err === true && typeof err.log === "function") {
      err.log(request.logger || Logger)
    } else if (err.getStatus!() === HttpStatus.NOT_FOUND) {
      logger.debug(
        err,
        `[${err.getStatus!()}] Resource not found - ${err.name}`,
      )
    } else if (err.getStatus!() < HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.warn(err, `[${err.getStatus!()}] Request rejected - ${err.name}`)
    } else {
      logger.error(err, `[${err.getStatus!()}] Request failed - ${err.name}`)
    }

    const acceptsHtml = request.headers?.accept?.includes("text/html")
    const errorTemplate = response.locals?.errorTemplate

    if (acceptsHtml && errorTemplate) {
      logger.debug(
        err,
        `Rendering error template "${errorTemplate}" for [${err.getStatus!()}]`,
      )
      response.status(err.getStatus!()).render(errorTemplate, {
        ...response.locals,
        exception: err.getResponse!(),
      })
    } else {
      response.status(err.getStatus!()).json(err.getResponse!())
    }
  }
}
