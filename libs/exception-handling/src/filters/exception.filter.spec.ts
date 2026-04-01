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
import { MockLoggerService } from "fixtures/loggers"
import { express } from "fixtures/express"

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
    const module = await Test.createTestingModule({
      providers: [NeomaExceptionFilter],
    }).compile()

    filter = module.get(NeomaExceptionFilter)

    loggerSpy = {
      error: jest.spyOn(Logger, "error").mockImplementation(),
      warn: jest.spyOn(Logger, "warn").mockImplementation(),
      debug: jest.spyOn(Logger, "debug").mockImplementation(),
    }
  })

  describe("Response", () => {
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

    it("should handle duck-typed exceptions by responding with the status and response from getStatus and getResponse", () => {
      const name = faker.hacker.noun()
      const statusCode = faker.number.int({
        min: HttpStatus.BAD_REQUEST,
        max: HttpStatus.INTERNAL_SERVER_ERROR,
      })
      const res = {
        statusCode,
        message: faker.hacker.phrase(),
        error: faker.hacker.phrase(),
      }
      const customException = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => res,
      }

      const host = executionContext() as ArgumentsHost
      filter.catch(customException, host)

      const response = host.switchToHttp().getResponse()
      expect(response.statusCode).toBe(statusCode)
      expect(response.json).toHaveBeenCalledWith(res)
    })
  })

  describe("Using the NestJS default logger", () => {
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
          `[500] Request failed - ${err.name}`,
          "NeomaExceptionFilter",
        )
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.debug).not.toHaveBeenCalled()
      })
    })

    it("should use the default Logger to log a debug message if a duck typed exception's getStatus function returns a 404", () => {
      const name = faker.hacker.noun()
      const statusCode = HttpStatus.NOT_FOUND
      const customException = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      const host = executionContext() as ArgumentsHost
      filter.catch(customException, host)

      expect(loggerSpy.debug).toHaveBeenCalledWith(
        customException,
        `[404] Resource not found - ${name}`,
        "NeomaExceptionFilter",
      )
      expect(loggerSpy.warn).not.toHaveBeenCalled()
      expect(loggerSpy.error).not.toHaveBeenCalled()
    })

    it("should use the default Logger to log a warning message if a duck typed exception's getStatus function returns a 4xx (excluding 404)", () => {
      const name = faker.hacker.noun()
      let statusCode = faker.number.int({
        min: HttpStatus.BAD_REQUEST,
        max: 499,
      })
      if (statusCode === HttpStatus.NOT_FOUND) {
        // Ensure we don't accidentally pick 404
        statusCode = HttpStatus.BAD_REQUEST
      }
      const customException = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      const host = executionContext() as ArgumentsHost
      filter.catch(customException, host)

      expect(loggerSpy.warn).toHaveBeenCalledWith(
        customException,
        `[${statusCode}] Request rejected - ${name}`,
        "NeomaExceptionFilter",
      )
      expect(loggerSpy.debug).not.toHaveBeenCalled()
      expect(loggerSpy.error).not.toHaveBeenCalled()
    })

    it("should use the default Logger to log an error message if a duck typed exception's getStatus function returns a 5xx", () => {
      const name = faker.hacker.noun()
      const statusCode = faker.number.int({
        min: HttpStatus.INTERNAL_SERVER_ERROR,
        max: 599,
      })
      const customException = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      const host = executionContext() as ArgumentsHost
      filter.catch(customException, host)

      expect(loggerSpy.error).toHaveBeenCalledWith(
        customException,
        `[${statusCode}] Request failed - ${name}`,
        "NeomaExceptionFilter",
      )
      expect(loggerSpy.debug).not.toHaveBeenCalled()
      expect(loggerSpy.warn).not.toHaveBeenCalled()
    })

    describe("And the exception implements a log method", () => {
      it("should call the exception's log method with the default Logger", () => {
        const customException = {
          ...new Error(),
          name: faker.hacker.noun(),
          log: jest.fn(),
        }

        const host = executionContext() as ArgumentsHost
        filter.catch(customException, host)

        expect(customException.log).toHaveBeenCalledWith(Logger)
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.debug).not.toHaveBeenCalled()
        expect(loggerSpy.error).not.toHaveBeenCalled()
      })
    })
  })

  describe("Using an overriden NestJs Logger", () => {
    let host: ArgumentsHost
    beforeEach(() => {
      Logger.overrideLogger(new MockLoggerService())
      host = executionContext() as ArgumentsHost
    })

    warnExceptions.forEach((err: HttpException) => {
      it(`should use the overriden Logger to log a warning for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(loggerSpy.warn).toHaveBeenCalledWith(
          `[${err.getStatus()}] Request rejected - ${err.name}`,
          { err },
        )
        expect(loggerSpy.debug).not.toHaveBeenCalled()
        expect(loggerSpy.error).not.toHaveBeenCalled()
      })
    })

    debugExceptions.forEach((err: HttpException) => {
      it(`should use the overriden Logger to log a debug message for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(loggerSpy.debug).toHaveBeenCalledWith(
          `[${err.getStatus()}] Resource not found - ${err.name}`,
          { err },
        )
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.error).not.toHaveBeenCalled()
      })
    })

    errorExceptions.forEach((err: HttpException) => {
      it(`should use the overriden Logger to log a error for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(loggerSpy.error).toHaveBeenCalledWith(
          `[${err.getStatus()}] Request failed - ${err.name}`,
          { err },
        )
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.debug).not.toHaveBeenCalled()
      })
    })

    unhandledExceptions.forEach((err: Error) => {
      it(`should use the overriden Logger to log an error for uncaught (non-http) exceptions of type ${err.constructor.name}`, () => {
        filter.catch(err, host)

        expect(loggerSpy.error).toHaveBeenCalledWith(
          `[500] Request failed - ${err.name}`,
          { err },
        )
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.debug).not.toHaveBeenCalled()
      })
    })

    it("should use the overriden Logger to log a debug message if a duck typed exception's getStatus function returns a 404", () => {
      const name = faker.hacker.noun()
      const statusCode = HttpStatus.NOT_FOUND
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(loggerSpy.debug).toHaveBeenCalledWith(
        `[404] Resource not found - ${name}`,
        { err },
      )
      expect(loggerSpy.warn).not.toHaveBeenCalled()
      expect(loggerSpy.error).not.toHaveBeenCalled()
    })

    it("should use the overriden Logger to log a warning message if a duck typed exception's getStatus function returns a 4xx (excluding 404)", () => {
      const name = faker.hacker.noun()
      let statusCode = faker.number.int({
        min: HttpStatus.BAD_REQUEST,
        max: 499,
      })
      if (statusCode === HttpStatus.NOT_FOUND) {
        // Ensure we don't accidentally pick 404
        statusCode = HttpStatus.BAD_REQUEST
      }
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(loggerSpy.warn).toHaveBeenCalledWith(
        `[${statusCode}] Request rejected - ${name}`,
        { err },
      )
      expect(loggerSpy.debug).not.toHaveBeenCalled()
      expect(loggerSpy.error).not.toHaveBeenCalled()
    })

    it("should use the overriden Logger to log an error message if a duck typed exception's getStatus function returns a 5xx", () => {
      const name = faker.hacker.noun()
      const statusCode = faker.number.int({
        min: HttpStatus.INTERNAL_SERVER_ERROR,
        max: 599,
      })
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(loggerSpy.error).toHaveBeenCalledWith(
        `[${statusCode}] Request failed - ${name}`,
        { err },
      )
      expect(loggerSpy.debug).not.toHaveBeenCalled()
      expect(loggerSpy.warn).not.toHaveBeenCalled()
    })

    describe("And the exception implements a log method", () => {
      it("should call the exception's log method with the default Logger", () => {
        const customException = {
          ...new Error(),
          name: faker.hacker.noun(),
          log: jest.fn(),
        }

        const host = executionContext() as ArgumentsHost
        filter.catch(customException, host)

        expect(customException.log).toHaveBeenCalledWith(Logger)
        expect(loggerSpy.warn).not.toHaveBeenCalled()
        expect(loggerSpy.debug).not.toHaveBeenCalled()
        expect(loggerSpy.error).not.toHaveBeenCalled()
      })
    })
  })

  describe("Using req.logger if available", () => {
    let logger: MockLoggerService
    let host: ArgumentsHost
    beforeEach(() => {
      logger = new MockLoggerService()
      host = executionContext(
        express.request({
          logger,
        }),
      ) as ArgumentsHost
    })

    warnExceptions.forEach((err: HttpException) => {
      it(`should use the request Logger to log a warning for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(logger.warn).toHaveBeenCalledWith(
          `[${err.getStatus()}] Request rejected - ${err.name}`,
          { err },
        )
        expect(logger.debug).not.toHaveBeenCalled()
        expect(logger.error).not.toHaveBeenCalled()
      })

      it(`should not use the default Logger to log a warning for ${err.name}s`, () => {
        filter.catch(err, host)
        expect(loggerSpy.warn).not.toHaveBeenCalled()
      })
    })

    debugExceptions.forEach((err: HttpException) => {
      it(`should use the request Logger to log a debug message for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(logger.debug).toHaveBeenCalledWith(
          `[${err.getStatus()}] Resource not found - ${err.name}`,
          { err },
        )
        expect(logger.warn).not.toHaveBeenCalled()
        expect(logger.error).not.toHaveBeenCalled()
      })

      it(`should not use the default Logger to log a debug message for ${err.name}s`, () => {
        filter.catch(err, host)
        expect(loggerSpy.debug).not.toHaveBeenCalled()
      })
    })

    errorExceptions.forEach((err: HttpException) => {
      it(`should use the request Logger to log a error for ${err.name}s`, () => {
        filter.catch(err, host)

        expect(logger.error).toHaveBeenCalledWith(
          `[${err.getStatus()}] Request failed - ${err.name}`,
          { err },
        )
        expect(logger.warn).not.toHaveBeenCalled()
        expect(logger.debug).not.toHaveBeenCalled()
      })

      it(`should not use the default Logger to log a error for ${err.name}s`, () => {
        filter.catch(err, host)
        expect(loggerSpy.error).not.toHaveBeenCalled()
      })
    })

    unhandledExceptions.forEach((err: Error) => {
      it(`should use the request Logger to log an error for uncaught (non-http) exceptions of type ${err.constructor.name}`, () => {
        filter.catch(err, host)

        expect(logger.error).toHaveBeenCalledWith(
          `[500] Request failed - ${err.name}`,
          { err },
        )
        expect(logger.warn).not.toHaveBeenCalled()
        expect(logger.debug).not.toHaveBeenCalled()
      })
    })

    it("should use the request Logger to log a debug message if a duck typed exception's getStatus function returns a 404", () => {
      const name = faker.hacker.noun()
      const statusCode = HttpStatus.NOT_FOUND
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(logger.debug).toHaveBeenCalledWith(
        `[404] Resource not found - ${name}`,
        { err },
      )
      expect(logger.warn).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it("should use the request Logger to log a warning message if a duck typed exception's getStatus function returns a 4xx (excluding 404)", () => {
      const name = faker.hacker.noun()
      let statusCode = faker.number.int({
        min: HttpStatus.BAD_REQUEST,
        max: 499,
      })
      if (statusCode === HttpStatus.NOT_FOUND) {
        // Ensure we don't accidentally pick 404
        statusCode = HttpStatus.BAD_REQUEST
      }
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(logger.warn).toHaveBeenCalledWith(
        `[${statusCode}] Request rejected - ${name}`,
        { err },
      )
      expect(logger.debug).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it("should use the request Logger to log an error message if a duck typed exception's getStatus function returns a 5xx", () => {
      const name = faker.hacker.noun()
      const statusCode = faker.number.int({
        min: HttpStatus.INTERNAL_SERVER_ERROR,
        max: 599,
      })
      const err = {
        ...new Error(),
        name,
        getStatus: (): number => statusCode,
        getResponse: (): object => ({
          statusCode,
          message: faker.hacker.phrase(),
          error: faker.hacker.phrase(),
        }),
      }

      filter.catch(err, host)

      expect(logger.error).toHaveBeenCalledWith(
        `[${statusCode}] Request failed - ${name}`,
        { err },
      )
      expect(logger.debug).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
    })

    describe("And the exception implements a log method", () => {
      it("should call the exception's log method with the request Logger", () => {
        const customException = {
          ...new Error(),
          name: faker.hacker.noun(),
          log: jest.fn(),
        }

        filter.catch(customException, host)

        expect(customException.log).toHaveBeenCalledWith(logger)
        expect(logger.warn).not.toHaveBeenCalled()
        expect(logger.debug).not.toHaveBeenCalled()
        expect(logger.error).not.toHaveBeenCalled()
      })
    })
  })

  describe("Content negotiation", () => {
    const templateName = faker.system.directoryPath()
    const errorTemplateOptions = { default: templateName }

    it("should render the error template when the request accepts HTML and an error template is set", () => {
      const exception = new NotFoundException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html,application/xhtml+xml" },
      })
      const res = express.response({
        locals: {
          errorTemplate: errorTemplateOptions,
          version: faker.system.semver(),
        },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.render).toHaveBeenCalledWith(templateName, {
        ...res.locals,
        exception: exception.getResponse(),
      })
      expect(response.json).not.toHaveBeenCalled()
    })

    it("should respond with JSON when the request accepts HTML but no error template is set", () => {
      const exception = new NotFoundException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html,application/xhtml+xml" },
      })
      const host = executionContext(req) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.json).toHaveBeenCalledWith(exception.getResponse())
      expect(response.render).not.toHaveBeenCalled()
    })

    it("should respond with JSON when the request does not accept HTML even if an error template is set", () => {
      const exception = new NotFoundException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "application/json" },
      })
      const res = express.response({
        locals: { errorTemplate: errorTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.json).toHaveBeenCalledWith(exception.getResponse())
      expect(response.render).not.toHaveBeenCalled()
    })

    it("should respond with JSON when the request has no Accept header even if an error template is set", () => {
      const exception = new NotFoundException(faker.hacker.phrase())
      const req = express.request({ headers: {} })
      const res = express.response({
        locals: { errorTemplate: errorTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.json).toHaveBeenCalledWith(exception.getResponse())
      expect(response.render).not.toHaveBeenCalled()
    })

    it("should log a debug message when rendering an error template", () => {
      const exception = new BadRequestException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: errorTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      expect(loggerSpy.debug).toHaveBeenCalledWith(
        exception,
        `Rendering error template "${templateName}" for [${exception.getStatus()}]`,
        "NeomaExceptionFilter",
      )
    })

    it("should render the error template for unhandled exceptions with a 500 status", () => {
      const exception = new Error(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: errorTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(response.render).toHaveBeenCalledWith(templateName, {
        ...res.locals,
        exception: {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Internal server error",
          error: "Internal Server Error",
        },
      })
      expect(response.json).not.toHaveBeenCalled()
    })
  })

  describe("Content negotiation with exception-specific templates", () => {
    const badRequestTemplate = faker.system.directoryPath()
    const serverErrorTemplate = faker.system.directoryPath()
    const defaultTemplate = faker.system.directoryPath()
    const multiTemplateOptions = {
      BadRequestException: badRequestTemplate,
      InternalServerErrorException: serverErrorTemplate,
      default: defaultTemplate,
    }

    it("should render the matched template for a BadRequestException", () => {
      const exception = new BadRequestException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.render).toHaveBeenCalledWith(badRequestTemplate, {
        ...res.locals,
        exception: exception.getResponse(),
      })
      expect(response.json).not.toHaveBeenCalled()
    })

    it("should render the matched template for an InternalServerErrorException", () => {
      const exception = new InternalServerErrorException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.render).toHaveBeenCalledWith(serverErrorTemplate, {
        ...res.locals,
        exception: exception.getResponse(),
      })
      expect(response.json).not.toHaveBeenCalled()
    })

    it("should fall back to the default template for a NotFoundException with no matching key", () => {
      const exception = new NotFoundException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.render).toHaveBeenCalledWith(defaultTemplate, {
        ...res.locals,
        exception: exception.getResponse(),
      })
      expect(response.json).not.toHaveBeenCalled()
    })

    it("should fall back to the default template for an unhandled Error", () => {
      const exception = new Error(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.render).toHaveBeenCalledWith(defaultTemplate, {
        ...res.locals,
        exception: {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Internal server error",
          error: "Internal Server Error",
        },
      })
      expect(response.json).not.toHaveBeenCalled()
    })

    it("should respond with JSON when the request does not accept HTML", () => {
      const exception = new BadRequestException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "application/json" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      const response = host.switchToHttp().getResponse()
      expect(response.json).toHaveBeenCalledWith(exception.getResponse())
      expect(response.render).not.toHaveBeenCalled()
    })

    it("should log the resolved template name in the debug message", () => {
      const exception = new BadRequestException(faker.hacker.phrase())
      const req = express.request({
        headers: { accept: "text/html" },
      })
      const res = express.response({
        locals: { errorTemplate: multiTemplateOptions },
      })
      const host = executionContext(req, res) as ArgumentsHost

      filter.catch(exception, host)

      expect(loggerSpy.debug).toHaveBeenCalledWith(
        exception,
        `Rendering error template "${badRequestTemplate}" for [${exception.getStatus()}]`,
        "NeomaExceptionFilter",
      )
    })
  })
})
