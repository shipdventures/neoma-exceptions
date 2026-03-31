import { SetMetadata } from "@nestjs/common"

/**
 * Metadata key used by {@link ErrorTemplate} and read by
 * {@link ErrorTemplateInterceptor}.
 */
export const ERROR_TEMPLATE_KEY = "error-template"

/**
 * Route decorator that specifies which template to render when an exception
 * occurs on this endpoint and the client accepts HTML.
 *
 * The template name is stored as route metadata under the key
 * {@link ERROR_TEMPLATE_KEY}. The {@link ErrorTemplateInterceptor} reads this
 * metadata and stashes it on `res.locals.errorTemplate` so that the
 * {@link NeomaExceptionFilter} can content-negotiate between `render()` and
 * `json()`.
 *
 * @param template - The view template path to render on error (e.g. `"auth/magic-link"`).
 *
 * @example
 * ```typescript
 * import { ErrorTemplate } from '@neoma/exception-handling'
 *
 * @Controller('auth')
 * export class AuthController {
 *   @ErrorTemplate('auth/magic-link')
 *   @Post('magic-link')
 *   public sendMagicLink(@Body() dto: SendMagicLinkDto) {}
 * }
 * ```
 */
export const ErrorTemplate = (template: string): MethodDecorator =>
  SetMetadata(ERROR_TEMPLATE_KEY, template)
