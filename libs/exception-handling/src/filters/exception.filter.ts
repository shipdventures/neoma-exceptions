import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"

@Catch()
export class NeomaExceptionFilter implements ExceptionFilter {
  public catch(err: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse()
    if (err instanceof HttpException) {
      if (err.getStatus() === HttpStatus.NOT_FOUND) {
        Logger.debug(
          err,
          `[${err.getStatus()}] Resource not found - ${err.name}`,
          "NeomaExceptionFilter",
        )
      } else if (err.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR) {
        Logger.warn(
          err,
          `[${err.getStatus()}] Request rejected - ${err.name}`,
          "NeomaExceptionFilter",
        )
      } else {
        Logger.error(
          err,
          `[${err.getStatus()}] Request failed - ${err.name}`,
          "NeomaExceptionFilter",
        )
      }
      response.status(err.getStatus()).json(err.getResponse())
    } else {
      Logger.error(
        err,
        `[500] Unhandled exception - ${err.constructor.name}`,
        "NeomaExceptionFilter",
      )
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
      })
    }
  }
}
