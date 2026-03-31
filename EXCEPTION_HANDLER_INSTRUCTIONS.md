# Exception Handler Enhancement Instructions

## Context

The `@neoma/exception-handling` package at `/Users/danielbruce/Dropbox/shipd/neoma/neoma-exception-handling` currently handles exceptions for API applications only — it always responds with `response.status(...).json(...)`. We need to extend it to support hypermedia/template-based applications that need `response.render()` for HTML responses.

We also want to bundle a `ValidationPipe` with an `exceptionFactory` that transforms validation errors into a field-keyed shape that's useful for both templates and API consumers.

## What exists today

### Exception Filter (`libs/exception-handling/src/filters/exception.filter.ts`)
- Global `@Catch()` filter that catches all exceptions
- Duck-types exceptions: checks for `getStatus()`, `getResponse()`, `log()` methods
- Adds defaults for missing methods (500 status, generic response)
- Logs based on status code: 404→DEBUG, 4xx→WARN, 5xx→ERROR
- Always responds with JSON: `response.status(err.getStatus!()).json(err.getResponse!())`

### Module (`libs/exception-handling/src/exception-handler.module.ts`)
- Registers `NeomaExceptionFilter` via `APP_FILTER`
- Zero configuration

### Interface (`libs/exception-handling/src/interfaces/neoma-exception.interface.ts`)
- `NeomaException` with optional `getStatus()`, `getResponse()`, `log()` methods

## Changes Required

### 1. `@ErrorTemplate` Decorator (new file)

Create a `SetMetadata`-based decorator that marks a controller method with an error template name:

```typescript
@ErrorTemplate("auth/magic-link")
@Post("magic-link")
public sendMagicLink(@Body() dto: SendMagicLinkDto) {}
```

This stores the template name as route metadata under the key `"error-template"`.

### 2. `ErrorTemplateInterceptor` (new file)

A global `NestInterceptor` that:
1. Injects NestJS `Reflector`
2. In `intercept()`, reads the `"error-template"` metadata from the handler via `context.getHandler()`
3. If present, stashes it on `res.locals.errorTemplate`
4. Calls `next.handle()` as normal

This is needed because `ExceptionFilter` receives `ArgumentsHost` (no access to handler metadata), not `ExecutionContext`. The interceptor bridges the gap by reading metadata while it's available and storing it on `res.locals` for the filter to use later.

### 3. Update `NeomaExceptionFilter` (`libs/exception-handling/src/filters/exception.filter.ts`)

Change the response line (currently line 209) from always using JSON to content-negotiating:

```typescript
// Currently:
response.status(err.getStatus!()).json(err.getResponse!())

// Should become:
const acceptsHtml = request.headers?.accept?.includes("text/html")
const errorTemplate = response.locals?.errorTemplate

if (acceptsHtml && errorTemplate) {
  response.status(err.getStatus!()).render(errorTemplate, {
    ...response.locals,
    exception: err.getResponse!(),
  })
} else {
  response.status(err.getStatus!()).json(err.getResponse!())
}
```

Key points:
- Check the request `Accept` header for `text/html`
- Check `res.locals.errorTemplate` (set by the interceptor)
- If both conditions met: render the template, spreading `res.locals` (preserves `version` etc.) and adding `exception` with the error response
- Otherwise: existing JSON behaviour unchanged
- API applications are completely unaffected

### 4. Validation Factory (new file)

Port the validation factory from `/Users/danielbruce/Dropbox/shipd/products/wolv/starter/app/src/common/validation.factory.ts` into the package.

This transforms the `ValidationPipe`'s array of `ValidationError` objects into a field-keyed object:

```typescript
// Input: ValidationError[]
[
  { property: "email", value: "bad", constraints: { isEmail: "must be valid" } }
]

// Output: passed to BadRequestException
{
  email: { value: "bad", error: "must be valid" }
}
```

This shape is better than the NestJS default (`{ message: ["must be valid"] }`) for both templates (inline field errors) and APIs (programmatic field mapping).

### 5. Update `ExceptionHandlerModule`

Register both the filter and a global `ValidationPipe` with the factory, plus the interceptor:

```typescript
@Module({
  providers: [
    { provide: APP_FILTER, useClass: NeomaExceptionFilter },
    { provide: APP_PIPE, useValue: new ValidationPipe({ exceptionFactory: validationFactory }) },
    { provide: APP_INTERCEPTOR, useClass: ErrorTemplateInterceptor },
  ],
})
export class ExceptionHandlerModule {}
```

### 6. Update exports (`libs/exception-handling/src/index.ts`)

Export the new decorator, interceptor, and factory so consumers can use `@ErrorTemplate` in their controllers.

## Testing approach

Follow the existing test patterns in the package:

- **Unit tests** for the filter: add cases for HTML content negotiation (render vs json)
- **Unit tests** for the interceptor: verify it reads metadata and sets `res.locals`
- **Unit tests** for the validation factory: port/adapt tests if they exist in wolv, otherwise write new ones testing the transform
- **E2E tests**: add a test endpoint with `@ErrorTemplate`, verify HTML response when `Accept: text/html`, verify JSON response otherwise

## Important constraints

- All existing tests must continue to pass — API behaviour is unchanged
- The package follows strict code standards: no semicolons, explicit return types, explicit member accessibility, JSDoc on all public classes/methods
- Use `@faker-js/faker` for test data
- Follow the existing duck-typing pattern — no breaking interface changes
