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

const withTemplatePath = system.directoryPath()
const withoutTemplatePath = system.directoryPath()

const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`

@Controller(controllerPath)
class ControllerClass {
  @ErrorTemplate(templateName)
  @Get(withTemplatePath)
  @UseInterceptors(ErrorTemplateInterceptor)
  public withTemplate(@Res({ passthrough: true }) res: Response): object {
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

  it("should set res.locals.errorTemplate when @ErrorTemplate is present", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withTemplatePath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toBe(templateName)
  })

  it("should not set res.locals.errorTemplate when @ErrorTemplate is not present", async () => {
    const response = await supertest(app.getHttpServer())
      .get(`${controllerPath}${withoutTemplatePath}`)
      .expect(HttpStatus.OK)

    expect(response.body.errorTemplate).toBeUndefined()
  })
})
