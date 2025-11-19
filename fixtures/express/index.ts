import { faker } from "@faker-js/faker"
import crypto from "crypto"
import { Request, Response } from "express"
import { Socket } from "net"

const { helpers, internet, system } = faker

const caseInsensitiveSearch = (
  obj: Record<string, string | string[] | undefined>,
  key: string,
): any => {
  return obj[key] || obj[key.toLowerCase()]
}

const convertHeadersToLowerCase = (
  headers: Record<string, any>,
): Record<string, any> => {
  const clonedHeaders = { ...headers }
  Object.keys(clonedHeaders).forEach((key) => {
    clonedHeaders[key.toLowerCase()] = clonedHeaders[key]
    delete clonedHeaders[key]
  })
  return clonedHeaders
}

type ExpressFixtures = {
  /**
   * Creates a signed cookie string using the provided value and secret according
   * to how the cookie-parser library would sign a cookie, i.e. HMAC-SHA256.
   *
   * @param val The cookie value to sign, if an object it will be JSON.stringified
   * to create the string that will be signed.
   * @param secret The secret to use to sign the cookie. If not provided an unsigned
   * cookie will be returend.
   *
   * @returns The signed cookie string in the format of `${prefix}${val}.${signature}; Path=/`
   * with prefix and signature being encoded with encodeURIComponent.
   *
   * Note: The prefix s: is used to sigend cookies j: is used for json cookies,
   * and s:j: is used for signed json cookies.
   *
   * @see https://github.com/expressjs/cookie-parser?tab=readme-ov-file#cookieparsersecret-options
   */
  cookie(val: string | object, secret?: string): string

  /**
   * Creates a Partial Response object with status, json, and header functions that
   * are instances of a jest.Mock and with a locals property.
   *
   * @param locals Any locals to populate the response's locals property.
   * @param headers Any headers to set on the response. They will be accessible through
   * both the getHeaders and get functions.
   *
   * @returns A Partial Response object with status, get, getHeaders, removeHeader, json,
   * header, render and send functions, and a locals property.
   */
  response: (
    options?: Partial<Response & { headers?: Record<string, any> }>,
  ) => Partial<Response>

  /**
   * Creates a Partial Request object with body, and headers properties, and a partial response
   * object. Also adds convenice methods get and header to provide case insensitive access to
   * the request headers.
   *
   * @param req A Partial Request to provide values for body, headers, and res objects,
   * and get, and headers functions. Any properties not provided will use sensible defaults.
   * In addition other properties can be provided to be attached directly to the request e.g.
   * logger.
   *
   * @returns A Partial Request object and  any other properties provided in the req parameter.
   */
  request: (
    options?: Partial<Request> & Record<string, any>,
  ) => Pick<
    Request,
    | "body"
    | "headers"
    | "method"
    | "url"
    | "res"
    | "path"
    | "params"
    | "signedCookies"
  > &
    Record<string, any>
}

export const express: ExpressFixtures = {
  /**
   * Creates a signed cookie string using the provided value and secret according
   * to how the cookie-parser library would sign a cookie, i.e. HMAC-SHA256.
   *
   * @param val The cookie value to sign, if an object it will be JSON.stringified
   * to create the string that will be signed.
   * @param secret The secret to use to sign the cookie. Defaults to the value of
   * process.env.COOKIE_SECRET.
   *
   * @returns The signed cookie string in the format of `${prefix}${val}.${signature}; Path=/`
   * with prefix and signature being encoded with encodeURIComponent.
   *
   * Note: The prefix s: is used to sigend cookies j: is used for json cookies,
   * and s:j: is used for signed json cookies.
   *
   * @see https://github.com/expressjs/cookie-parser?tab=readme-ov-file#cookieparsersecret-options
   */
  cookie(val: string | object, secret): string {
    const cookieValue = typeof val === "string" ? val : JSON.stringify(val)
    const prefix = typeof val === "string" ? "s:" : "s:j:"
    if (!secret) {
      return `${encodeURIComponent(prefix)}${cookieValue}; Path=/`
    }

    const signature = crypto
      .createHmac("sha256", secret)
      .update(cookieValue)
      .digest("base64")
      .replace(/=+$/, "")

    return `${encodeURIComponent(prefix)}${cookieValue}.${encodeURIComponent(signature)}; Path=/`
  },

  response(
    {
      locals = { layout: system.fileName() },
      headers = {},
    }: Partial<Response & { headers?: Record<string, any> }> = {
      locals: { layout: system.fileName() },
      headers: {},
    },
  ): Partial<Response> {
    const clonedHeaders = convertHeadersToLowerCase(headers)
    return {
      getHeaders(): Record<string, any> {
        return clonedHeaders
      },
      get(name: string): any {
        return caseInsensitiveSearch(clonedHeaders, name)
      },
      header(field: string, value?: string | Array<string>): Response {
        clonedHeaders[field] = value
        return this
      },
      removeHeader(name): void {
        delete clonedHeaders[name]
        delete clonedHeaders[name.toLowerCase()]
      },
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      status(code: number): Response {
        this.statusCode = code
        return this
      },
      json: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      locals,
    }
  },

  request(
    {
      body = {},
      headers = {},
      method = helpers.arrayElement(["GET", "POST", "PUT", "DELETE", "PATCH"]),
      url = internet.url(),
      res = express.response() as Response,
      path = system.filePath(),
      params = {},
      signedCookies = {},
    }: Partial<Request> & Record<string, any> = {
      body: {},
      headers: {},
      method: helpers.arrayElement(["GET", "POST", "PUT", "DELETE", "PATCH"]),
      url: internet.url(),
      res: express.response() as Response,
      path: system.filePath(),
      params: {},
      signedCookies: {},
    },
  ): Pick<
    Request,
    | "body"
    | "headers"
    | "method"
    | "url"
    | "res"
    | "path"
    | "params"
    | "signedCookies"
  > &
    Record<string, any> {
    return {
      get(name: string): any {
        return caseInsensitiveSearch(headers, name)
      },
      header(name: string): any {
        return caseInsensitiveSearch(headers, name)
      },
      // eslint-disable-next-line prefer-rest-params
      ...(arguments[0] as Partial<Request>),
      body,
      headers,
      method,
      url,
      res: <Response>res,
      path,
      params,
      signedCookies,
      // Must include the connection so that the Bunyan req seriazlier treats it as a real request.
      connection: {} as Socket,
    }
  },
} as const
