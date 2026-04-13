import { faker } from "@faker-js/faker"
import { ExecutionContext } from "@nestjs/common"
import { express } from "fixtures/express"
import { executionContext } from "fixtures/nestjs"

import {
  ERROR_TEMPLATE_KEY,
  ErrorTemplateMetadata,
} from "../decorators/error-template.decorator"
import { ErrorTemplateMetadataBridge } from "./error-template-metadata-bridge.guard"

const { system } = faker

describe("ErrorTemplateMetadataBridge", () => {
  const guard = new ErrorTemplateMetadataBridge()

  describe("canActivate", () => {
    describe("Given the handler has no @ErrorTemplate metadata", () => {
      const handler = (): void => {}

      describe("When canActivate is called", () => {
        it("Then it should return true", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should not set res.locals.errorTemplate", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).not.toHaveProperty("errorTemplate")
          expect(res.locals).not.toHaveProperty("errorTemplateLocals")
        })
      })
    })

    describe("Given the handler has @ErrorTemplate with a string template", () => {
      const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`
      const handler = (): void => {}

      beforeEach(() => {
        const metadata: ErrorTemplateMetadata = {
          templates: { default: templateName },
          locals: {},
        }
        Reflect.defineMetadata(ERROR_TEMPLATE_KEY, metadata, handler)
      })

      describe("When canActivate is called", () => {
        it("Then it should return true", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should set res.locals.errorTemplate to a normalised object", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty("errorTemplate", {
            default: templateName,
          })
        })

        it("Then it should set res.locals.errorTemplateLocals to an empty object", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty("errorTemplateLocals", {})
        })
      })
    })

    describe("Given the handler has @ErrorTemplate with an options object", () => {
      const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`
      const secondTemplateName = `${system.directoryPath()}/${faker.hacker.noun()}`
      const thirdTemplateName = `${system.directoryPath()}/${faker.hacker.noun()}`
      const handler = (): void => {}

      const templates = {
        BadRequestException: secondTemplateName,
        InternalServerErrorException: thirdTemplateName,
        default: templateName,
      }

      beforeEach(() => {
        const metadata: ErrorTemplateMetadata = {
          templates,
          locals: {},
        }
        Reflect.defineMetadata(ERROR_TEMPLATE_KEY, metadata, handler)
      })

      describe("When canActivate is called", () => {
        it("Then it should return true", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should set res.locals.errorTemplate to the full options object", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty("errorTemplate", templates)
        })
      })
    })

    describe("Given the handler has @ErrorTemplate with a string template and locals", () => {
      const templateName = `${system.directoryPath()}/${faker.hacker.noun()}`
      const templateLocals = {
        formAction: faker.internet.url(),
        pageTitle: faker.lorem.words(),
      }
      const handler = (): void => {}

      beforeEach(() => {
        const metadata: ErrorTemplateMetadata = {
          templates: { default: templateName },
          locals: templateLocals,
        }
        Reflect.defineMetadata(ERROR_TEMPLATE_KEY, metadata, handler)
      })

      describe("When canActivate is called", () => {
        it("Then it should set res.locals.errorTemplate to a normalised object", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty("errorTemplate", {
            default: templateName,
          })
        })

        it("Then it should set res.locals.errorTemplateLocals to the provided locals", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty(
            "errorTemplateLocals",
            templateLocals,
          )
        })
      })
    })

    describe("Given the handler has @ErrorTemplate with options and locals", () => {
      const templateA = `${system.directoryPath()}/${faker.hacker.noun()}`
      const templateB = `${system.directoryPath()}/${faker.hacker.noun()}`
      const templateC = `${system.directoryPath()}/${faker.hacker.noun()}`
      const templates = {
        BadRequestException: templateA,
        InternalServerErrorException: templateB,
        default: templateC,
      }
      const templateLocals = {
        formAction: faker.internet.url(),
        pageTitle: faker.lorem.words(),
      }
      const handler = (): void => {}

      beforeEach(() => {
        const metadata: ErrorTemplateMetadata = {
          templates,
          locals: templateLocals,
        }
        Reflect.defineMetadata(ERROR_TEMPLATE_KEY, metadata, handler)
      })

      describe("When canActivate is called", () => {
        it("Then it should set res.locals.errorTemplate", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty("errorTemplate", templates)
        })

        it("Then it should set res.locals.errorTemplateLocals", () => {
          const res = express.response({ locals: {} })
          const context = executionContext(
            express.request({ res }),
            res,
            handler,
          ) as ExecutionContext

          guard.canActivate(context)

          expect(res.locals).toHaveProperty(
            "errorTemplateLocals",
            templateLocals,
          )
        })
      })
    })
  })
})
