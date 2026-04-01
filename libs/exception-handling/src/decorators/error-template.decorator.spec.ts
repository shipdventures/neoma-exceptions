import { faker } from "@faker-js/faker"
import { Controller, Get } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import {
  ErrorTemplate,
  ErrorTemplateOptions,
  ERROR_TEMPLATE_KEY,
} from "./error-template.decorator"

const templateName = faker.system.filePath()

@Controller()
class TestController {
  @ErrorTemplate(templateName)
  @Get()
  public handlerWithString(): void {}

  @ErrorTemplate({ default: templateName })
  @Get("with-options")
  public handlerWithOptions(): void {}

  @Get("no-template")
  public handlerWithoutTemplate(): void {}
}

describe("@ErrorTemplate", () => {
  const reflector = new Reflector()

  it("should normalise a string to an ErrorTemplateOptions object", () => {
    const metadata = reflector.get<ErrorTemplateOptions>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithString,
    )

    expect(metadata).toEqual({ default: templateName })
  })

  it("should store an ErrorTemplateOptions object as-is", () => {
    const metadata = reflector.get<ErrorTemplateOptions>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithOptions,
    )

    expect(metadata).toEqual({ default: templateName })
  })

  it("should not set metadata on handlers without the decorator", () => {
    const metadata = reflector.get<ErrorTemplateOptions>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithoutTemplate,
    )

    expect(metadata).toBeUndefined()
  })
})
