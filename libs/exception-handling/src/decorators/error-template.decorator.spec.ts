import { faker } from "@faker-js/faker"
import { Controller, Get } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { ErrorTemplate, ERROR_TEMPLATE_KEY } from "./error-template.decorator"

const templateName = faker.system.filePath()

@Controller()
class TestController {
  @ErrorTemplate(templateName)
  @Get()
  public handler(): void {}

  @Get("no-template")
  public handlerWithoutTemplate(): void {}
}

describe("@ErrorTemplate", () => {
  const reflector = new Reflector()

  it("should set the error template metadata on the handler", () => {
    const metadata = reflector.get<string>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handler,
    )

    expect(metadata).toBe(templateName)
  })

  it("should not set metadata on handlers without the decorator", () => {
    const metadata = reflector.get<string>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithoutTemplate,
    )

    expect(metadata).toBeUndefined()
  })
})
