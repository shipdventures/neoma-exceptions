import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Observable } from "rxjs"
import {
  ERROR_TEMPLATE_KEY,
  ErrorTemplateOptions,
} from "../decorators/error-template.decorator"

/**
 * Global interceptor that reads the `"error-template"` metadata set by the
 * {@link ErrorTemplate} decorator and stashes the {@link ErrorTemplateOptions}
 * object on `res.locals.errorTemplate`.
 *
 * This bridges the gap between `ExecutionContext` (available in interceptors,
 * which has access to handler metadata) and `ArgumentsHost` (available in
 * exception filters, which does not). By storing the template configuration on
 * `res.locals`, the {@link NeomaExceptionFilter} can later read it to
 * decide whether to `render()` or `json()`.
 *
 * Registered globally via `APP_INTERCEPTOR` in {@link ExceptionHandlerModule}.
 *
 * @see ErrorTemplate for the decorator that sets the metadata
 * @see NeomaExceptionFilter for the filter that reads `res.locals.errorTemplate`
 */
@Injectable()
export class ErrorTemplateInterceptor implements NestInterceptor {
  public constructor(private readonly reflector: Reflector) {}

  /**
   * Reads the {@link ErrorTemplateOptions} metadata from the current route
   * handler and, if present, stores it on `res.locals.errorTemplate` before
   * continuing the request pipeline.
   *
   * @param context - The execution context providing access to the handler and request/response.
   * @param next - The next handler in the chain.
   * @returns The observable returned by the next handler.
   */
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const template = this.reflector.get<ErrorTemplateOptions>(
      ERROR_TEMPLATE_KEY,
      context.getHandler(),
    )

    if (template) {
      const response = context.switchToHttp().getResponse()
      response.locals.errorTemplate = template
    }

    return next.handle()
  }
}
