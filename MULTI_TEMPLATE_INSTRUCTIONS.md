# Multi-Template Error Rendering

## Goal

Extend `@ErrorTemplate` to support per-exception-type template mapping, so different exceptions on the same route can render different templates.

## Current State (v0.4.0)

`@ErrorTemplate` accepts a single string — one template for all errors on a route:

```typescript
@ErrorTemplate('auth/magic-link')
```

The filter resolves it at `libs/exception-handling/src/filters/exception.filter.ts:227`:

```typescript
const errorTemplate = response.locals?.errorTemplate
// errorTemplate is always a string
```

## What to Build

### Two signatures for `@ErrorTemplate`

**String (existing)** — single template for all errors:

```typescript
@ErrorTemplate('errors/generic')
```

**Options object (new)** — per-exception-type templates with a required `default` fallback:

```typescript
@ErrorTemplate({
  BadRequestException: 'auth/magic-link',
  NotFoundException: 'errors/not-found',
  default: 'errors/500',
})
```

### Changes Required

#### 1. Decorator (`libs/exception-handling/src/decorators/error-template.decorator.ts`)

- Add `ErrorTemplateOptions` interface with a required `default` key and `[exceptionName: string]: string` index signature
- Update `ErrorTemplate` to accept `string | ErrorTemplateOptions`
- Export `ErrorTemplateOptions` so consumers can use the type
- Update JSDoc with both signatures

#### 2. Interceptor (`libs/exception-handling/src/interceptors/error-template.interceptor.ts`)

No change needed — it passes through whatever metadata value is stored (string or object).

#### 3. Filter (`libs/exception-handling/src/filters/exception.filter.ts`)

Update the template resolution logic (currently line 227-240):

```typescript
const errorTemplate = response.locals?.errorTemplate
let templateName: string | undefined

if (typeof errorTemplate === 'string') {
  templateName = errorTemplate
} else if (typeof errorTemplate === 'object') {
  templateName = errorTemplate[err.name] || errorTemplate.default
}

if (acceptsHtml && templateName) {
  // render templateName
} else {
  // json
}
```

Key: match on `err.name` which is consistent with how existing logging identifies exceptions (e.g. `"BadRequestException"`, `"Error"`, `"TypeError"`).

#### 4. Tests

**Decorator spec** (`libs/exception-handling/src/decorators/error-template.decorator.spec.ts`):
- Test that options object is stored as metadata

**Filter spec** (`libs/exception-handling/src/filters/exception.filter.spec.ts`):
- Options object: matching exception name renders the specific template
- Options object: non-matching exception name falls back to `default`
- Options object: unhandled `Error` falls back to `default`
- String signature continues to work (existing tests cover this)

**E2E spec** (`specs/content-negotiation.e2e-spec.ts`):
- Add a route with `@ErrorTemplate({ ... })` options object
- Test that the correct template is rendered per exception type
- Test that `default` is used for unmatched exceptions

**Content negotiation module** (`src/content-negotiation.module.ts`):
- Add test endpoints that use the options object signature

**Template files** (`specs/views/`):
- May need additional `.ejs` templates to prove the correct one was rendered

#### 5. Exports (`libs/exception-handling/src/index.ts`)

`ErrorTemplateOptions` will be auto-exported via the existing `export *` from the decorator file.

#### 6. Documentation

- Update README.md API Reference for `@ErrorTemplate` with both signatures
- Update CHANGELOG.md under `[Unreleased]`
- Update filter JSDoc content negotiation section

## Important Constraints

- String signature must remain unchanged — fully backwards compatible
- `default` is required when using the options object (TypeScript enforces this)
- Template lookup uses `err.name` — same property used in existing log messages
- All existing tests must continue to pass
