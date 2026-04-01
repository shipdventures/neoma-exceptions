import { faker } from "@faker-js/faker"
import {
  Controller,
  Get,
  HttpStatus,
  Module,
  Res,
  UseInterceptors,
} from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { Test, TestingModule } from "@nestjs/testing"
import { Response } from "express"
import * as supertest from "supertest"
import { ErrorTemplate } from "../decorators/error-template.decorator"
import { ErrorTemplateInterceptor } from "./error-template.interceptor"

const { system } = faker
const controllerPath = system.directoryPath()

const withStringPath = system.directoryPath()
const withOptionsPath = system.directoryPath()
const withoutTemplatePath = system.directoryPath()

const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`

@Controller(controllerPath)
class ControllerClass {
  @ErrorTemplate(templateName)
  @Get(withStringPath)
  @UseInterceptors(ErrorTemplateInterceptor)
  public withString(@Res({ passthrough: true }) res: Response): object {
    return { errorTemplate: res.locals.errorTemplate }
  }

  @ErrorTemplate({ default: templateName })
  @Get(withOptionsPath)
  @UseInterceptors(ErrorTemplateInterceptor)
  public withOptions(@Res({ passthrough: true }) res: Response): object {
    return { errorTemplate: res.locals.errorTemplate }
  }

  @Get(withoutTemplatePath)
  @UseInterceptors(ErrorTemplateInterceptor)
  public withoutTemplate(@Res({ passthrough: true }) res: Response): object {
    return { errorTemplate: res.locals.errorTemplate }
  }
}

@Module({
  controllers: [ControllerClass],
})
class InterceptorTestModule {}

describe("ErrorTemplateInterceptor", () => {
  let app: NestExpressApplication

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InterceptorTestModule],
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

  it("should set res.locals.errorTemplate to the options object when @ErrorTemplate is passed an object", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withOptionsPath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toEqual({ default: templateName })
  })

  it("should not set res.locals.errorTemplate when @ErrorTemplate is not present", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withoutTemplatePath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toBeUndefined()
  })
})
