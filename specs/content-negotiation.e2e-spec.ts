import { readFileSync } from "fs"
import { join } from "path"

import { HttpStatus } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { managedAppInstance } from "@neoma/managed-app"
import * as ejs from "ejs"
import * as request from "supertest"

const errorTemplate = readFileSync(
  join(process.cwd(), "specs", "views", "error.ejs"),
  "utf-8",
)
const badRequestTemplate = readFileSync(
  join(process.cwd(), "specs", "views", "bad-request.ejs"),
  "utf-8",
)
const serverErrorTemplate = readFileSync(
  join(process.cwd(), "specs", "views", "server-error.ejs"),
  "utf-8",
)

const configureViewEngine = (app: any): void => {
  const expressApp = app as unknown as NestExpressApplication
  expressApp.setBaseViewsDir(join(__dirname, "views"))
  expressApp.setViewEngine("ejs")
}

describe("Content Negotiation", () => {
  let app: Awaited<ReturnType<typeof managedAppInstance>>

  beforeEach(async () => {
    app = await managedAppInstance({
      module: "src/content-negotiation.module.ts#ContentNegotiationModule",
      configure: configureViewEngine,
    })
  })

  describe("When the route has @ErrorTemplate", () => {
    it("should render the error template when the request accepts text/html", async () => {
      const exception = {
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not found",
        error: "Not Found",
      }
      const expectedHtml = ejs.render(errorTemplate, {
        errorTemplate: { default: "error" },
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-template")
        .set("Accept", "text/html")
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedHtml)
    })

    it("should respond with JSON when the request accepts application/json", async () => {
      await request(app.getHttpServer())
        .post("/with-template")
        .set("Accept", "application/json")
        .expect(HttpStatus.NOT_FOUND)
        .expect("Content-Type", /json/)
    })

    it("should respond with JSON when the request has no Accept header", async () => {
      await request(app.getHttpServer())
        .post("/with-template")
        .set("Accept", "")
        .expect(HttpStatus.NOT_FOUND)
        .expect("Content-Type", /json/)
    })
  })

  describe("When the route has @ErrorTemplate with a default-only options object", () => {
    it("should render the error template when the request accepts text/html", async () => {
      const exception = {
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not found",
        error: "Not Found",
      }
      const expectedHtml = ejs.render(errorTemplate, {
        errorTemplate: { default: "error" },
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-default-template")
        .set("Accept", "text/html")
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedHtml)
    })

    it("should respond with JSON when the request accepts application/json", async () => {
      await request(app.getHttpServer())
        .post("/with-default-template")
        .set("Accept", "application/json")
        .expect(HttpStatus.NOT_FOUND)
        .expect("Content-Type", /json/)
    })

    it("should respond with JSON when the request has no Accept header", async () => {
      await request(app.getHttpServer())
        .post("/with-default-template")
        .set("Accept", "")
        .expect(HttpStatus.NOT_FOUND)
        .expect("Content-Type", /json/)
    })
  })

  describe("When the route does not have @ErrorTemplate", () => {
    it("should respond with JSON even when the request accepts text/html", async () => {
      await request(app.getHttpServer())
        .post("/without-template")
        .set("Accept", "text/html")
        .expect(HttpStatus.BAD_REQUEST)
        .expect("Content-Type", /json/)
    })
  })

  describe("Validation", () => {
    it("should return field-keyed validation errors as JSON", async () => {
      const response = await request(app.getHttpServer())
        .post("/with-template-and-validation")
        .set("Accept", "application/json")
        .send({ name: "ab", email: "bad" })
        .expect(HttpStatus.BAD_REQUEST)

      expect(response.body).toMatchObject({
        name: { value: "ab", error: "Name must be at least 5 characters" },
        email: { value: "bad", error: "Email must be a valid email address" },
      })
    })

    it("should render validation errors as HTML when the request accepts text/html and an error template is set", async () => {
      const exception = {
        name: { value: "ab", error: "Name must be at least 5 characters" },
        email: {
          value: "bad",
          error: "Email must be a valid email address",
        },
      }
      const expectedHtml = ejs.render(errorTemplate, {
        errorTemplate: { default: "error" },
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-template-and-validation")
        .set("Accept", "text/html")
        .send({ name: "ab", email: "bad" })
        .expect(HttpStatus.BAD_REQUEST)
        .expect(expectedHtml)
    })
  })

  describe("When the route has @ErrorTemplate with exception-specific templates", () => {
    const multiTemplateConfig = {
      BadRequestException: "bad-request",
      InternalServerErrorException: "server-error",
      default: "error",
    }

    it("should render the BadRequestException template when a BadRequestException is thrown", async () => {
      const exception = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Bad request",
        error: "Bad Request",
      }
      const expectedHtml = ejs.render(badRequestTemplate, {
        errorTemplate: multiTemplateConfig,
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-multi-template")
        .query({ type: "bad-request" })
        .set("Accept", "text/html")
        .expect(HttpStatus.BAD_REQUEST)
        .expect(expectedHtml)
    })

    it("should render the InternalServerErrorException template when an InternalServerErrorException is thrown", async () => {
      const exception = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Server error",
        error: "Internal Server Error",
      }
      const expectedHtml = ejs.render(serverErrorTemplate, {
        errorTemplate: multiTemplateConfig,
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-multi-template")
        .query({ type: "server-error" })
        .set("Accept", "text/html")
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect(expectedHtml)
    })

    it("should render the default template when an unmatched Error is thrown", async () => {
      const exception = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
      }
      const expectedHtml = ejs.render(errorTemplate, {
        errorTemplate: multiTemplateConfig,
        exception,
      })

      await request(app.getHttpServer())
        .post("/with-multi-template")
        .query({ type: "unhandled" })
        .set("Accept", "text/html")
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect(expectedHtml)
    })

    it("should respond with JSON when the request accepts application/json", async () => {
      await request(app.getHttpServer())
        .post("/with-multi-template")
        .query({ type: "bad-request" })
        .set("Accept", "application/json")
        .expect(HttpStatus.BAD_REQUEST)
        .expect("Content-Type", /json/)
    })
  })
})
