# Neoma Ecosystem Development Context

## Overview
This document captures the essential context and patterns established during the development of `@neoma/config` to guide future `@neoma/*` ecosystem packages, particularly `@neoma/logger`.

## Ecosystem Philosophy
**Goal**: Create a package ecosystem where each SaaS project doesn't require tons of boilerplate. Each package handles one concern well, can be used independently, but works seamlessly together.

**Packages in roadmap**:
1. ✅ `@neoma/config` - Environment configuration (COMPLETE v0.3.0)
2. 🚧 `@neoma/logger` - Request/Application logging (NEXT)
3. ⏳ Exception Handler - Consistent error responses
4. ⏳ Garmr (Sanctum for Nest) - Authentication
5. ⏳ Stripe integration - Payment processing

## Package Design Patterns

### Core Architecture
- **Vertical slices** over horizontal layers
- **Optional adapters** for different use cases (e.g., `-api`, `-htmx` variants)
- **Ecosystem integration** without tight coupling
- **NestJS patterns** - `forRoot()`, dependency injection, decorators

### Integration Pattern Established
**Key Innovation**: Use the `'property' in config` pattern for safe ecosystem integration:

```typescript
// Safe existence checking without triggering strict mode
if ('logLevel' in config) {
  const level = config.logLevel  // Only access if exists
} else {
  const level = 'info'  // Use default
}
```

This enables packages to optionally integrate with `@neoma/config` while maintaining strict mode compatibility.

## @neoma/config Package (Reference Implementation)

### Final Feature Set (v0.3.0)
- ✅ **Type-safe environment access** with camelCase → SCREAMING_SNAKE_CASE conversion
- ✅ **Environment file loading** (`.env`, `.env.local`, `.env.{NODE_ENV}`, `.env.{NODE_ENV}.local`)
- ✅ **Strict mode** - Runtime validation with descriptive errors
- ✅ **Has trap** - Safe property existence checking for ecosystem integration
- ✅ **Type coercion** - Automatic primitive conversion with intelligent edge cases

### Key Files Structure
```
libs/config/
├── src/
│   ├── config.service.ts     # Core Proxy-based service
│   ├── config.module.ts      # NestJS module with forRoot()
│   ├── config.service.spec.ts # Comprehensive tests
│   ├── config.module.spec.ts  # Integration tests
│   └── index.ts              # Public exports
├── package.json              # Published package config
└── README.md                 # Complete documentation
```

### Established Patterns
1. **Proxy-based implementation** for dynamic property access
2. **forRoot() pattern** for module configuration
3. **Optional dependency injection** with fallback defaults
4. **Package imports in tests** (`@neoma/config`) vs relative imports
5. **Comprehensive JSDoc** with examples and edge cases
6. **Semantic versioning** with detailed changelogs

## @neoma/logger Requirements (From Previous Analysis)

### Existing Implementation Reference
User provided existing `RequestLoggerService` and `ApplicationLoggerService` implementations using:
- **Bunyan** (not Pino) as the underlying logger
- **Request-scoped** service for request context
- **Application-scoped** service for general logging
- **Sensitive data serialization** for `dto` and `entity` fields
- **Standard request serialization** with `Bunyan.stdSerializers.req`

### Key Specs From Existing Code
```typescript
// Request-scoped logger
@Injectable({ scope: Scope.REQUEST })
export class RequestLoggerService {
  constructor(
    @Inject(REQUEST) private request: Request,
    private config: ApplicationConfigurationService
  ) {
    this.logger = Bunyan.createLogger({
      name: `request::${config.name}`,
      // ... bunyan config with request context
    })
  }
}

// Application-scoped logger
@Injectable()
export class ApplicationLoggerService implements OnApplicationBootstrap {
  constructor(private config: ApplicationConfigurationService) {
    this.logger = Bunyan.createLogger({
      name: `app::${config.name}`,
      // ... bunyan config
    })
  }
}
```

### Integration Strategy for @neoma/logger
Based on established patterns, the logger should:

1. **Optional @neoma/config integration**:
```typescript
// In LoggerModule
providers: [
  {
    provide: 'LOGGER_CONFIG',
    useExisting: ConfigService,  // When available
    optional: true
  }
]

// In Logger service
constructor(
  @Optional() @Inject('LOGGER_CONFIG') 
  private config?: any  // Uses 'in' checks for safe access
) {
  const level = 'logLevel' in config ? config.logLevel : 'info'
  const format = 'logFormat' in config ? config.logFormat : 'json'
}
```

2. **Dual service approach**:
   - `ApplicationLoggerService` - App-scoped singleton
   - `RequestLoggerService` - Request-scoped with auto context

3. **NestJS LoggerService compliance** for ecosystem compatibility

## Technical Decisions & Lessons Learned

### Build & Development
- **Monorepo structure** with `libs/` directory
- **Package imports** in tests to test published interface
- **TypeScript strict mode** throughout
- **Jest testing** with custom matchers (`.toBeTrue()`, `.toBeString()`, etc.)

### Documentation Standards
- **Verbose documentation** with examples (DX is king!)
- **JSDoc completeness** - `@param`, `@returns`, `@example`, `@throws`
- **README sections**: Problem → Solution → Installation → Features → API Reference
- **Changelog format**: Keep a Changelog standard with semantic versioning

### Code Quality
- **No comments** unless explicitly requested
- **Helper functions** outside classes when no `this` access needed
- **Defensive patterns** for edge cases (empty strings, leading zeros, etc.)
- **Comprehensive test coverage** including edge cases

### Release Process
1. Feature development on branch
2. Comprehensive testing (unit + integration)
3. Documentation updates (README + JSDoc + changelog)
4. Merge to main
5. Version bump + changelog update
6. Release commit
7. Tag and publish

## Configuration Coercion Edge Cases (Reference)
The coercion feature required careful handling of edge cases:

- `"007"` → `"007"` (decimal leading zeros preserved)
- `" 123 "` → `123` (whitespace trimmed and converted)
- `""` → `""` (empty strings preserved)
- `"0.123"` → `0.123` (valid decimals converted)
- `"true"/"false"` → boolean conversion only for exact strings
- Hex/octal/binary number formats supported
- Special values: `"null"`, `"undefined"`, `"Infinity"`, `"NaN"`

## Next Session Prep for @neoma/logger

### Immediate Tasks
1. **Create package structure** (`libs/logger/`)
2. **Analyze existing implementations** to extract patterns
3. **Design integration** with `@neoma/config` using established patterns
4. **Implement dual logger services** (app + request scoped)
5. **Add comprehensive tests** following established patterns

### Key Questions to Resolve
1. Should sensitive field serialization be configurable?
2. How to handle LoggerService interface compliance?
3. What logging levels/methods to expose?
4. How to structure the module exports?

### Files to Reference
- This context document
- `libs/config/src/config.service.ts` - Proxy implementation patterns
- `libs/config/src/config.module.ts` - Module forRoot() patterns
- User's existing logger implementations (RequestLoggerService + ApplicationLoggerService)

---

**Created**: 2025-11-05  
**Purpose**: Provide comprehensive context for continuing @neoma ecosystem development  
**Status**: Ready for @neoma/logger development