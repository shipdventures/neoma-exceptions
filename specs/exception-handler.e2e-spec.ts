import { HttpStatus } from "@nestjs/common"
import { managedAppInstance } from "@neoma/managed-app"
import { faker } from "@faker-js/faker"
import * as request from "supertest"

const httpErrorStatuses = [
  HttpStatus.BAD_REQUEST,
  HttpStatus.NOT_FOUND,
  HttpStatus.UNPROCESSABLE_ENTITY,
  HttpStatus.INTERNAL_SERVER_ERROR,
  HttpStatus.SERVICE_UNAVAILABLE,
]

describe("Identical Error Responses", () => {
  const message = faker.hacker.phrase()
  let nestJsApp: Awaited<ReturnType<typeof managedAppInstance>>
  let customApp: Awaited<ReturnType<typeof managedAppInstance>>

  beforeEach(async () => {
    nestJsApp = await managedAppInstance("src/app.module.ts#AppModule")
    customApp = await managedAppInstance(
      "src/exception.module.ts#ExceptionModule",
    )
  })

  httpErrorStatuses.forEach((status) => {
    it(`should mirror the standard NestJS Exception handling of an HTTP ${status}`, async () => {
      const res = await request(nestJsApp.getHttpServer())
        .get("/error")
        .query({ status, message })
        .expect(status)

      await request(customApp.getHttpServer())
        .get("/error")
        .query({ status, message })
        .expect(status)
        .expect(res.body as object)
    })
  })

  it("should handle non-HTTP exceptions identically to NestJS", async () => {
    await request(nestJsApp.getHttpServer())
      .get("/error")
      .query({ status: -1, message })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)

    await request(customApp.getHttpServer())
      .get("/error")
      .query({ status: -1, message })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Internal Server Error",
      })
  })
})
