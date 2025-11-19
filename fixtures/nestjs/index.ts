import { ExecutionContext } from "@nestjs/common"
import { Request, Response } from "express"
import { express } from "../express"

/**
 * Creates a partial ExecutionContext with a switchToHttp method that then allows
 * access to req and res through getRequest and getResponse methods respectively.
 *
 * ExecutionContext extends ArgumentsHost so use this function to create
 * ArgumentsHosts too.
 *
 * @param  req An express Request object that is returned when
 * switchToHttp().getRequest is called.
 * @param  res An express Response object that is returned when
 * switchToHttp().getResponse is called.
 * @returns A partial ExecutionContext that supports
 * switchToHttp.
 */
export const executionContext = (
  req: Partial<Request> = express.request(),
  res: Partial<Response> = req.res!,
): Partial<ExecutionContext> => {
  req.res = <Response>res
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(res),
      getRequest: jest.fn().mockReturnValue(req),
    }),
  }
}
