import { LoggerService } from "@nestjs/common"

/**
 * A mock service for representing the LoggerService in tests.
 *
 * @property debug A jest function that mocks the debug method from LoggerService.
 * @property error A jest function that mocks the error method from LoggerService.
 * @property fatal A jest function that mocks the fatal method from LoggerService.
 * @property log A jest function that mocks the log method from LoggerService.
 * @property trace A jest function that mocks the trace method from LoggerService.
 * @property warn A jest function that mocks the warn method from LoggerService.
 */
export class MockLoggerService implements LoggerService {
  public debug = jest.fn()
  public error = jest.fn()
  public fatal = jest.fn()
  public log = jest.fn()
  public trace = jest.fn()
  public warn = jest.fn()
}
