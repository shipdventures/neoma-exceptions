import { SetMetadata } from "@nestjs/common"

/**
 * Metadata key used by {@link ErrorTemplate} and read by
 * {@link ErrorTemplateMetadataBridge}.
 */
export const ERROR_TEMPLATE_KEY = "error-template"

/**
 * Maps exception names to template paths or redirect routes, with a required
 * `default` fallback.
 *
 * Keys are matched against `err.name` (e.g. `"BadRequestException"`,
 * `"Error"`). If no key matches, the `default` template is used.
 *
 * Values starting with `/` trigger a `303 See Other` redirect instead of
 * rendering a template.
 */
export interface ErrorTemplateOptions {
  default: string
  [exceptionName: string]: string
}

/**
 * Internal metadata shape stored by {@link ErrorTemplate} and read by
 * {@link ErrorTemplateMetadataBridge}.
 *
 * Bundles the template configuration with optional static locals that
 * are made available to the rendered template.
 */
export interface ErrorTemplateMetadata {
  templates: ErrorTemplateOptions
  locals: Record<string, unknown>
}

/**
 * Route decorator that specifies which template to render when an exception
 * occurs on this endpoint and the client accepts HTML.
 *
 * The template configuration is normalised to an {@link ErrorTemplateOptions}
 * object and bundled with any static locals into an {@link ErrorTemplateMetadata}
 * object, stored as route metadata under the key {@link ERROR_TEMPLATE_KEY}.
 * The {@link ErrorTemplateMetadataBridge} reads this metadata and stashes the
 * template options on `res.locals.errorTemplate` and the static locals on
 * `res.locals.errorTemplateLocals` so that the {@link NeomaExceptionFilter}
 * can content-negotiate between `render()` and `json()`.
 *
 * @param template - A single template path for all errors, or an
 *                   {@link ErrorTemplateOptions} object mapping exception names
 *                   to templates with a required `default` fallback.
 * @param locals - Optional static variables to make available to the template
 *                 under `errorTemplateLocals` (e.g. form action URLs, page titles).
 *
 * @example Single template for all errors
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
 *
 * @example Per-exception-type templates
 * ```typescript
 * import { ErrorTemplate } from '@neoma/exception-handling'
 *
 * @Controller('auth')
 * export class AuthController {
 *   @ErrorTemplate({
 *     BadRequestException: 'auth/magic-link',
 *     default: 'errors/500',
 *   })
 *   @Post('magic-link')
 *   public sendMagicLink(@Body() dto: SendMagicLinkDto) {}
 * }
 * ```
 *
 * @example Per-exception rendering with redirect fallback
 * ```typescript
 * import { ErrorTemplate } from '@neoma/exception-handling'
 *
 * @Controller('auth')
 * export class AuthController {
 *   @ErrorTemplate({
 *     BadRequestException: 'auth/magic-link',
 *     default: '/error',
 *   })
 *   @Post('magic-link')
 *   public sendMagicLink(@Body() dto: SendMagicLinkDto) {}
 * }
 * ```
 *
 * @example Template with static locals
 * ```typescript
 * import { ErrorTemplate } from '@neoma/exception-handling'
 *
 * @Controller('auth')
 * export class AuthController {
 *   @ErrorTemplate('auth/magic-link', {
 *     formAction: '/auth/magic-link',
 *     pageTitle: 'Sign In',
 *   })
 *   @Post('magic-link')
 *   public sendMagicLink(@Body() dto: SendMagicLinkDto) {}
 * }
 * ```
 */
export const ErrorTemplate = (
  template: string | ErrorTemplateOptions,
  locals: Record<string, unknown> = {},
): MethodDecorator =>
  SetMetadata(ERROR_TEMPLATE_KEY, {
    templates: typeof template === "string" ? { default: template } : template,
    locals,
  } satisfies ErrorTemplateMetadata)
