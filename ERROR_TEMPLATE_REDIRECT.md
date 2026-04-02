# @ErrorTemplate — Redirect Support via `/` Prefix Convention

## Context
`@ErrorTemplate` currently only supports rendering templates via `res.render()`. When a non-validation error occurs (e.g. SMTP failure), the error page is rendered inline at the current URL (e.g. `/auth/magic-link`), which is confusing for the user. The URL should change to reflect the error page (e.g. `/error`).

A redirect to a dedicated error route is cleaner — the user sees `/error` in the address bar, and the error page can be UI-tested independently via `GET /error`.

## Solution
Use a convention: if the resolved template value starts with `/`, the filter calls `res.redirect()` instead of `res.render()`. EJS template paths are always relative to the views directory (e.g. `auth/magic-link`, `errors/500`), so `/` prefix is unambiguous.

### Consumer usage (unchanged API)
```typescript
@ErrorTemplate({
  BadRequestException: "auth/magic-link",   // renders template
  default: "/error",                         // redirects to /error
})
```

## Implementation

### `NeomaExceptionFilter` (`libs/exception-handling/src/filters/exception.filter.ts`)
In the content negotiation block where it resolves the template name:

```typescript
const templateName = errorTemplate[err.name] || errorTemplate.default

if (templateName.startsWith("/")) {
  response.redirect(templateName)
} else {
  response.status(err.getStatus()).render(templateName, {
    ...response.locals,
    exception: err.getResponse(),
  })
}
```

### Tests (`libs/exception-handling/src/filters/exception.filter.spec.ts`)
- Add test: when template value starts with `/`, assert `response.redirect()` is called with the value
- Add test: when template value does not start with `/`, assert `response.render()` is called (existing behaviour)
- Add test: per-exception mapping where one exception renders and default redirects

### JSDoc
Update the `@ErrorTemplate` decorator JSDoc to document the redirect convention with an example.

Update the `NeomaExceptionFilter` content negotiation JSDoc to mention redirect behaviour.

## Files to modify
- `libs/exception-handling/src/filters/exception.filter.ts` — add redirect logic
- `libs/exception-handling/src/filters/exception.filter.spec.ts` — add redirect tests
- `libs/exception-handling/src/decorators/error-template.decorator.ts` — update JSDoc

## Version Bump
Minor: `0.6.0`

## Verification
```bash
npm run build
npm run lint
npm test
npm run test:e2e
```
