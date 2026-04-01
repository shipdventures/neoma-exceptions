import { faker } from "@faker-js/faker"
import { Controller, Get } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import {
  ErrorTemplate,
  ErrorTemplateMetadata,
  ERROR_TEMPLATE_KEY,
} from "./error-template.decorator"

const templateName = faker.system.filePath()
const locals = {
  formAction: faker.internet.url(),
  pageTitle: faker.lorem.words(),
}

@Controller()
class TestController {
  @ErrorTemplate(templateName)
  @Get()
  public handlerWithString(): void {}

  @ErrorTemplate({ default: templateName })
  @Get("with-options")
  public handlerWithOptions(): void {}

  @ErrorTemplate(templateName, locals)
  @Get("with-string-and-locals")
  public handlerWithStringAndLocals(): void {}

  @ErrorTemplate({ default: templateName }, locals)
  @Get("with-options-and-locals")
  public handlerWithOptionsAndLocals(): void {}

  @Get("no-template")
  public handlerWithoutTemplate(): void {}
}

describe("@ErrorTemplate", () => {
  const reflector = new Reflector()

  it("should normalise a string to an ErrorTemplateMetadata object with empty locals", () => {
    const metadata = reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithString,
    )

    expect(metadata).toEqual({
      templates: { default: templateName },
      locals: {},
    })
  })

  it("should store an ErrorTemplateOptions object with empty locals", () => {
    const metadata = reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithOptions,
    )

    expect(metadata).toEqual({
      templates: { default: templateName },
      locals: {},
    })
  })

  it("should store locals alongside the normalised template options when given a string and locals", () => {
    const metadata = reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithStringAndLocals,
    )

    expect(metadata).toEqual({
      templates: { default: templateName },
      locals,
    })
  })

  it("should store locals alongside the template options when given options and locals", () => {
    const metadata = reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithOptionsAndLocals,
    )

    expect(metadata).toEqual({
      templates: { default: templateName },
      locals,
    })
  })

  it("should not set metadata on handlers without the decorator", () => {
    const metadata = reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      TestController.prototype.handlerWithoutTemplate,
    )

    expect(metadata).toBeUndefined()
  })
})
