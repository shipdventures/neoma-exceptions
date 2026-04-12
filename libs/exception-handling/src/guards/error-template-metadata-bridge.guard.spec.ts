import { faker } from "@faker-js/faker"
import { Controller, Get, HttpStatus, Module, Res } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { Test, TestingModule } from "@nestjs/testing"
import { Response } from "express"
import supertest from "supertest"
import { ErrorTemplate } from "../decorators/error-template.decorator"
import { ExceptionHandlerModule } from "../exception-handler.module"

const { system } = faker
const controllerPath = system.directoryPath()

const withStringPath = `/${faker.string.uuid()}`
const withOptionsPath = `/${faker.string.uuid()}`
const withStringAndLocalsPath = `/${faker.string.uuid()}`
const withOptionsAndLocalsPath = `/${faker.string.uuid()}`
const withoutTemplatePath = `/${faker.string.uuid()}`

const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`
const secondTemplateName = `${system.directoryPath()}/${faker.hacker.noun()}`
const thirdTemplateName = `${system.directoryPath()}/${faker.hacker.noun()}`
const locals = {
  formAction: faker.internet.url(),
  pageTitle: faker.lorem.words(),
}

@Controller(controllerPath)
class ControllerClass {
  @ErrorTemplate(templateName)
  @Get(withStringPath)
  public withString(@Res({ passthrough: true }) res: Response): object {
    return { errorTemplate: res.locals.errorTemplate }
  }

  @ErrorTemplate({
    BadRequestException: secondTemplateName,
    InternalServerErrorException: thirdTemplateName,
    default: templateName,
  })
  @Get(withOptionsPath)
  public withOptions(@Res({ passthrough: true }) res: Response): object {
    return { errorTemplate: res.locals.errorTemplate }
  }

  @ErrorTemplate(templateName, locals)
  @Get(withStringAndLocalsPath)
  public withStringAndLocals(
    @Res({ passthrough: true }) res: Response,
  ): object {
    return {
      errorTemplate: res.locals.errorTemplate,
      errorTemplateLocals: res.locals.errorTemplateLocals,
    }
  }

  @ErrorTemplate({ default: templateName }, locals)
  @Get(withOptionsAndLocalsPath)
  public withOptionsAndLocals(
    @Res({ passthrough: true }) res: Response,
  ): object {
    return {
      errorTemplate: res.locals.errorTemplate,
      errorTemplateLocals: res.locals.errorTemplateLocals,
    }
  }

  @Get(withoutTemplatePath)
  public withoutTemplate(@Res({ passthrough: true }) res: Response): object {
    return {
      errorTemplate: res.locals.errorTemplate,
      errorTemplateLocals: res.locals.errorTemplateLocals,
    }
  }
}

@Module({
  imports: [ExceptionHandlerModule],
  controllers: [ControllerClass],
})
class GuardTestModule {}

describe("ErrorTemplateMetadataBridge", () => {
  let app: NestExpressApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [GuardTestModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it("should set res.locals.errorTemplate to a normalised object when @ErrorTemplate is passed a string", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withStringPath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toEqual({ default: templateName })
  })

  it("should set res.locals.errorTemplate to the full options object when @ErrorTemplate is passed multiple exception-to-template mappings", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withOptionsPath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toEqual({
      BadRequestException: secondTemplateName,
      InternalServerErrorException: thirdTemplateName,
      default: templateName,
    })
  })

  it("should set res.locals.errorTemplateLocals when @ErrorTemplate is passed a string and locals", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withStringAndLocalsPath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toEqual({ default: templateName })
    expect(response.body.errorTemplateLocals).toEqual(locals)
  })

  it("should set res.locals.errorTemplateLocals when @ErrorTemplate is passed options and locals", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withOptionsAndLocalsPath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toEqual({ default: templateName })
    expect(response.body.errorTemplateLocals).toEqual(locals)
  })

  it("should not set res.locals.errorTemplate when @ErrorTemplate is not present", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withoutTemplatePath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toBeUndefined()
    expect(response.body.errorTemplateLocals).toBeUndefined()
  })
})
