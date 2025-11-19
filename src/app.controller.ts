import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  ParseIntPipe,
  Query,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common"

@Controller()
export class AppController {
  @Get("status")
  @HttpCode(HttpStatus.NO_CONTENT)
  public status(): void {
    // Health check endpoint - replace with your own endpoints
  }

  /**
   * Endpoint to simulate different HTTP errors based on query parameters.
   * Example: /error?status=404&message=Not%20Found
   *
   * @param statusCode - The HTTP status code to simulate - supports 400,
   * 404, 422, 500, and 503. All other status codes will result in a generic error.
   * Defaults to throwing a standard Error object.
   * @param message - The error message to return - Defaults to "Default Message".
   *
   * @throws Various HTTP exceptions based on the provided status code or an uncaught error.
   */
  @Get("error")
  public error(
    @Query("status", ParseIntPipe)
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    @Query("message") message = "Default Message",
  ): void {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        throw new BadRequestException(message)
      case HttpStatus.NOT_FOUND:
        throw new NotFoundException(message)
      case HttpStatus.UNPROCESSABLE_ENTITY:
        throw new UnprocessableEntityException(message)
      case HttpStatus.INTERNAL_SERVER_ERROR:
        throw new InternalServerErrorException(message)
      case HttpStatus.SERVICE_UNAVAILABLE:
        throw new ServiceUnavailableException(message)
      default:
        throw new Error(message)
    }
  }
}
