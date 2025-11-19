import { NeomaExceptionFilter } from "./exception.filter"
import { Test } from "@nestjs/testing"
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { faker } from "@faker-js/faker/."
import { executionContext } from "fixtures/nestjs"

type LoggerSpy = {
  error: jest.SpyInstance
  warn: jest.SpyInstance
  debug: jest.SpyInstance
}

const httpExceptions = [
  new BadRequestException(faker.hacker.phrase()),
  new NotFoundException(faker.hacker.phrase()),
  new UnprocessableEntityException(faker.hacker.phrase()),
  new InternalServerErrorException(faker.hacker.phrase()),
  new ServiceUnavailableException(faker.hacker.phrase()),
]

const warnExceptions = [
  new BadRequestException(faker.hacker.phrase()),
  new UnprocessableEntityException(faker.hacker.phrase()),
]

const debugExceptions = [new NotFoundException(faker.hacker.phrase())]

const errorExceptions = [
  new InternalServerErrorException(faker.hacker.phrase()),
  new ServiceUnavailableException(faker.hacker.phrase()),
]

const unhandledExceptions = [
  new Error(faker.hacker.phrase()),
  new TypeError(faker.hacker.phrase()),
]

describe("new NeomaExceptionFilter()", () => {
  let filter: NeomaExceptionFilter

  let loggerSpy: LoggerSpy
  beforeEach(async () => {
    loggerSpy = {
      error: jest.spyOn(Logger, "error").mockImplementation(),
      warn: jest.spyOn(Logger, "warn").mockImplementation(),
      debug: jest.spyOn(Logger, "debug").mockImplementation(),
    }

    const module = await Test.createTestingModule({
      providers: [NeomaExceptionFilter],
    }).compile()

    filter = module.get(NeomaExceptionFilter)
  })

  describe("Responding", () => {
    httpExceptions.forEach((exception: HttpException) => {
      it(`should handle ${exception.name} by responding with a HTTP ${exception.getStatus()} and the exception response`, () => {
        const host = executionContext() as ArgumentsHost
        filter.catch(exception, host)

        const response = host.switchToHttp().getResponse()
        expect(response.statusCode).toBe(exception.getStatus())
        expect(response.json).toHaveBeenCalledWith(exception.getResponse())
      })
    })

    it("should handle uncaught (non-HTTP) exceptions by responding with a HTTP 500 and a generic message", () => {
      const host = executionContext() as ArgumentsHost
      filter.catch(new Error(faker.hacker.phrase()), host)

      const response = host.switchToHttp().getResponse()
      expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(response.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
      })
    })
  })

  describe("Logging", () => {
    describe("Given the app is using the default Logger", () => {
      warnExceptions.forEach((err: HttpException) => {
        it(`should use the default Logger to log a warning for ${err.name}s`, () => {
          const host = executionContext() as ArgumentsHost
          filter.catch(err, host)

          expect(loggerSpy.warn).toHaveBeenCalledWith(
            err,
            `[${err.getStatus()}] Request rejected - ${err.name}`,
            "NeomaExceptionFilter",
          )
          expect(loggerSpy.debug).not.toHaveBeenCalled()
          expect(loggerSpy.error).not.toHaveBeenCalled()
        })
      })

      debugExceptions.forEach((err: HttpException) => {
        it(`should use the default Logger to log a debug message for ${err.name}s`, () => {
          const host = executionContext() as ArgumentsHost
          filter.catch(err, host)

          expect(loggerSpy.debug).toHaveBeenCalledWith(
            err,
            `[${err.getStatus()}] Resource not found - ${err.name}`,
            "NeomaExceptionFilter",
          )
          expect(loggerSpy.warn).not.toHaveBeenCalled()
          expect(loggerSpy.error).not.toHaveBeenCalled()
        })
      })

      errorExceptions.forEach((err: HttpException) => {
        it(`should use the default Logger to log an error for ${err.name}s`, () => {
          const host = executionContext() as ArgumentsHost
          filter.catch(err, host)

          expect(loggerSpy.error).toHaveBeenCalledWith(
            err,
            `[${err.getStatus()}] Request failed - ${err.name}`,
            "NeomaExceptionFilter",
          )
          expect(loggerSpy.warn).not.toHaveBeenCalled()
          expect(loggerSpy.debug).not.toHaveBeenCalled()
        })
      })

      unhandledExceptions.forEach((err: Error) => {
        it(`should use the default Logger to log an error for uncaught (non-http) exceptions of type ${err.constructor.name}`, () => {
          const host = executionContext() as ArgumentsHost
          filter.catch(err, host)

          expect(loggerSpy.error).toHaveBeenCalledWith(
            err,
            `[500] Unhandled exception - ${err.constructor.name}`,
            "NeomaExceptionFilter",
          )
          expect(loggerSpy.warn).not.toHaveBeenCalled()
          expect(loggerSpy.debug).not.toHaveBeenCalled()
        })
      })
    })
  })
})
