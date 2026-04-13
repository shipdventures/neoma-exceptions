import { faker } from "@faker-js/faker"
import { ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Test, TestingModule } from "@nestjs/testing"
import {
  ERROR_TEMPLATE_KEY,
  ErrorTemplateMetadata,
} from "../decorators/error-template.decorator"
import { ErrorTemplateMetadataBridge } from "./error-template-metadata-bridge.guard"

const { system } = faker

function buildLocals(): Record<string, unknown> {
  return {}
}

function buildExecutionContext(
  handler: () => void,
  locals: Record<string, unknown> = buildLocals(),
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => Object,
    switchToHttp: () => ({
      getResponse: () => ({ locals }),
      getRequest: () => ({}),
      getNext: () => ({}),
    }),
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => "http" as const,
  } as unknown as ExecutionContext
}

describe("ErrorTemplateMetadataBridge", () => {
  let guard: ErrorTemplateMetadataBridge

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorTemplateMetadataBridge, Reflector],
    }).compile()

    guard = module.get<ErrorTemplateMetadataBridge>(ErrorTemplateMetadataBridge)
  })

  describe("canActivate", () => {
    describe("Given the handler has no @ErrorTemplate metadata", () => {
      const handler = (): void => {}

      describe("When canActivate is called", () => {
        it("Then it should return true", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should not set res.locals.errorTemplate", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).not.toHaveProperty("errorTemplate")
          expect(locals).not.toHaveProperty("errorTemplateLocals")
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
          const context = buildExecutionContext(handler)

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should set res.locals.errorTemplate to a normalised object", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplate", {
            default: templateName,
          })
        })

        it("Then it should set res.locals.errorTemplateLocals to an empty object", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplateLocals", {})
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
          const context = buildExecutionContext(handler)

          const result = guard.canActivate(context)

          expect(result).toBe(true)
        })

        it("Then it should set res.locals.errorTemplate to the full options object", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplate", templates)
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
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplate", {
            default: templateName,
          })
        })

        it("Then it should set res.locals.errorTemplateLocals to the provided locals", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplateLocals", templateLocals)
        })
      })
    })

    describe("Given the handler has @ErrorTemplate with options and locals", () => {
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
        it("Then it should set res.locals.errorTemplate", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplate", {
            default: templateName,
          })
        })

        it("Then it should set res.locals.errorTemplateLocals", () => {
          const locals = buildLocals()
          const context = buildExecutionContext(handler, locals)

          guard.canActivate(context)

          expect(locals).toHaveProperty("errorTemplateLocals", templateLocals)
        })
      })
    })
  })
})
