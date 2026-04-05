import { ExecutionContext } from "@nestjs/common"
import { express, MockRequest, MockResponse } from "../express"

/**
 * Creates a partial ExecutionContext with a switchToHttp method that then allows
 * access to req and res through getRequest and getResponse methods respectively.
 *
 * ExecutionContext extends ArgumentsHost so use this function to create
 * ArgumentsHosts too.
 *
 * @param  req A MockRequest that is returned when
 * switchToHttp().getRequest is called.
 * @param  res A MockResponse that is returned when
 * switchToHttp().getResponse is called.
 * @returns A partial ExecutionContext that supports
 * switchToHttp.
 */
export const executionContext = (
  req: MockRequest = express.request(),
  res: MockResponse = req.res,
): Partial<ExecutionContext> => {
  req.res = res
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(res),
      getRequest: jest.fn().mockReturnValue(req),
    }),
  }
}
