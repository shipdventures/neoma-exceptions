import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import {
  ERROR_TEMPLATE_KEY,
  ErrorTemplateMetadata,
} from "../decorators/error-template.decorator"

/**
 * Global guard that reads the `"error-template"` metadata set by the
 * {@link ErrorTemplate} decorator and stashes the {@link ErrorTemplateOptions}
 * object on `res.locals.errorTemplate` and any static locals on
 * `res.locals.errorTemplateLocals`.
 *
 * This guard always returns `true` — it is not an authorization gate. It is
 * a metadata bridge that must run before any other guard so that if a
 * subsequent guard throws, the {@link NeomaExceptionFilter} can read the
 * template configuration from `res.locals` and content-negotiate between
 * `render()` and `json()`.
 *
 * **Why a guard and not an interceptor?** NestJS execution order is
 * middleware -> guards -> interceptors -> pipes -> handler. When a guard throws,
 * interceptors never run. A global guard registered via `APP_GUARD` runs
 * before class-level and method-level guards, ensuring metadata is always
 * available.
 *
 * Registered globally via `APP_GUARD` in {@link ExceptionHandlerModule}.
 *
 * @see ErrorTemplate for the decorator that sets the metadata
 * @see NeomaExceptionFilter for the filter that reads `res.locals.errorTemplate`
 */
@Injectable()
export class ErrorTemplateMetadataBridge implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  /**
   * Reads the {@link ErrorTemplateMetadata} from the current route handler
   * and, if present, stores the template options on `res.locals.errorTemplate`
   * and any static locals on `res.locals.errorTemplateLocals`.
   *
   * This guard is a metadata bridge, not an authorization gate — it always
   * returns `true`.
   *
   * @param context - The execution context providing access to the handler and request/response.
   * @returns Always `true`.
   */
  public canActivate(context: ExecutionContext): true {
    const metadata = this.reflector.get<ErrorTemplateMetadata>(
      ERROR_TEMPLATE_KEY,
      context.getHandler(),
    )

    if (metadata) {
      const response = context.switchToHttp().getResponse()
      response.locals.errorTemplate = metadata.templates
      response.locals.errorTemplateLocals = metadata.locals
    }

    return true
  }
}
