# @neoma/exception-handling

> Automatic exception handling and intelligent logging for NestJS applications

Laravel-inspired global exception handling that provides consistent error responses and smart logging based on error severity.

## Motivation

NestJS's default exception handling works, but lacks sophisticated logging patterns that differentiate between client errors (404s, validation errors) and server errors (500s, unhandled exceptions). Every production application needs:

- Consistent error response formatting
- Different log levels for different error types (404s shouldn't alarm you at 3am)
- Rich contextual logging with request details
- Zero boilerplate in your controllers

`@neoma/exception-handling` provides Laravel-quality exception handling for NestJS with a single import.

## The Problem

**Without this package:**

```typescript
// app.module.ts - No global exception handling
import { Module } from '@nestjs/common'

@Module({
  controllers: [UserController],
})
export class AppModule {}

// Your controller
@Get('users/:id')
async getUser(@Param('id') id: string) {
  const user = await this.users.findOne(id)
  if (!user) {
    // Throws NotFoundException, logs at ERROR level
    // 404s flood your error monitoring
    throw new NotFoundException('User not found')
  }
  return user
}
```

**Result:**
- All exceptions logged at the same level
- No request context in logs
- No differentiation between client errors and server errors
- Manual error handling in every controller

## The Solution

**With this package:**

```typescript
// app.module.ts - One-line setup
import { Module } from '@nestjs/common'
import { ExceptionHandlerModule } from '@neoma/exception-handling'

@Module({
  imports: [ExceptionHandlerModule],
  controllers: [UserController],
})
export class AppModule {}

// Your controller - unchanged
@Get('users/:id')
async getUser(@Param('id') id: string) {
  const user = await this.users.findOne(id)
  if (!user) {
    // Now automatically logged at DEBUG level with request context
    throw new NotFoundException('User not found')
  }
  return user
}
```

**Result:**
- ✅ 404s logged at DEBUG level (not in your error monitoring)
- ✅ 4xx errors logged at WARN level (client issues)
- ✅ 5xx errors logged at ERROR level (your problems)
- ✅ Full request context in every log
- ✅ Consistent error response format
- ✅ Zero controller boilerplate

## Installation

```bash
npm install @neoma/exception-handling
```

## Basic Usage

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common'
import { ExceptionHandlerModule } from '@neoma/exception-handling'

@Module({
  imports: [ExceptionHandlerModule],
})
export class AppModule {}
```

That's it. All exceptions are now handled automatically.

### 2. Throw Exceptions Anywhere

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException
} from '@nestjs/common'

@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.users.findOne(id)

    if (!user) {
      // Logged at DEBUG level
      throw new NotFoundException('User not found')
    }

    return user
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    if (!dto.email) {
      // Logged at WARN level
      throw new BadRequestException('Email is required')
    }

    // Unhandled errors logged at ERROR level
    return await this.users.create(dto)
  }
}
```

## How It Works

### Logging Levels

The exception filter intelligently logs based on HTTP status code:

| Status Code | Log Level | Example Exceptions | Rationale |
|-------------|-----------|-------------------|-----------|
| 404 | `DEBUG` | `NotFoundException` | Expected in normal operation, not an error |
| 400-499 | `WARN` | `BadRequestException`, `UnauthorizedException` | Client errors, worth monitoring |
| 500-599 | `ERROR` | `InternalServerErrorException` | Server errors, needs immediate attention |
| Non-HTTP | `ERROR` | `TypeError`, `ReferenceError` | Unhandled exceptions, critical |

### Log Format

Each log includes:
- **Status code** - For quick filtering
- **Error type** - The exception class name
- **Error details** - Full error object with message and stack trace
- **Request context** - HTTP method, URL, headers, etc.

Example log output:
```
ERROR [500 Request failed - InternalServerErrorException] {
  err: InternalServerErrorException: Database connection failed
      at UserService.findOne (src/users/user.service.ts:42:15)
      at UserController.getUser (src/users/user.controller.ts:18:29)
      ... stack trace ...
  req: {
    method: 'GET',
    url: '/users/123',
    headers: { ... }
  }
}
```

### Response Format

All exceptions return consistent JSON responses:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

For unhandled (non-HTTP) exceptions:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Logging

### Logger Selection

The exception filter selects a logger in the following priority order:

1. **Request logger (`req.logger`)** - If the request has a `logger` property, it will be used. This enables request-scoped logging with correlation IDs and request context.
2. **Overridden NestJS Logger** - If `Logger.overrideLogger()` was called with a custom implementation, that logger is used.
3. **Default NestJS Logger** - Falls back to the built-in ConsoleLogger.

### Using Request-Scoped Loggers

For the best logging experience, attach a logger to each request via middleware:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Attach a request-scoped logger with correlation ID
    req['logger'] = createLogger({
      correlationId: req.headers['x-correlation-id'] || uuid(),
      method: req.method,
      url: req.url,
    })
    next()
  }
}
```

When a `req.logger` is available, all exception logs will include request context automatically.

### Recommended: @neoma/logger

This package works best with [@neoma/logger](https://github.com/shipdventures/neoma-logger) for rich, structured error logging with full request context and production-grade features.

```typescript
import { Module } from '@nestjs/common'
import { LoggerModule } from '@neoma/logger'
import { ExceptionHandlerModule } from '@neoma/exception-handling'

@Module({
  imports: [
    LoggerModule.forRoot(),
    ExceptionHandlerModule,
  ],
})
export class AppModule {}
```

### Built-in NestJS Logger

Works with NestJS's built-in Logger out of the box. When using the default ConsoleLogger, logs are formatted as:

```typescript
Logger.error(err, message, 'NeomaExceptionFilter')
```

### Custom Loggers

Compatible with any logger implementing NestJS's `LoggerService` interface. For structured loggers (Pino, Winston, Bunyan), logs are formatted as:

```typescript
logger.error(message, { err })
```

This provides clean structured output with the full error object for better log aggregation and searching.

## API Reference

### `ExceptionHandlerModule`

A NestJS module that registers a global exception filter.

```typescript
import { ExceptionHandlerModule } from '@neoma/exception-handling'

@Module({
  imports: [ExceptionHandlerModule],
})
export class AppModule {}
```

**No configuration needed** - works out of the box with sensible defaults.

### `NeomaExceptionFilter`

The global exception filter (automatically registered by `ExceptionHandlerModule`).

You typically don't interact with this directly, but you can import it for testing:

```typescript
import { NeomaExceptionFilter } from '@neoma/exception-handling'

// In tests
const filter = new NeomaExceptionFilter()
```

## Advanced Usage

### Testing Exception Handling

```typescript
import { Test } from '@nestjs/testing'
import { ExceptionHandlerModule } from '@neoma/exception-handling'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

describe('Exception Handling', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ExceptionHandlerModule, YourModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  it('should return 404 for not found', () => {
    return request(app.getHttpServer())
      .get('/users/999')
      .expect(404)
      .expect({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      })
  })
})
```

### Custom Exception Classes

Works seamlessly with custom exceptions that extend `HttpException`:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common'

export class UserNotVerifiedException extends HttpException {
  constructor() {
    super('User email not verified', HttpStatus.FORBIDDEN)
  }
}

// In your controller
@Post('login')
async login(@Body() credentials: LoginDto) {
  const user = await this.users.findByEmail(credentials.email)

  if (!user.emailVerified) {
    // Logged at WARN level (403 is 4xx)
    throw new UserNotVerifiedException()
  }

  return this.auth.login(user)
}
```

### Duck-Typed Exceptions

You can also create custom exceptions without extending `HttpException`. The filter uses duck-typing to handle any exception that implements `getStatus()` and `getResponse()` methods:

```typescript
export class PaymentFailedException {
  public name = 'PaymentFailedException'

  constructor(private message: string) {}

  public getStatus(): number {
    return 402
  }

  public getResponse(): object {
    return {
      statusCode: 402,
      message: this.message,
      error: 'Payment Required',
    }
  }
}

// In your controller
@Post('checkout')
async checkout(@Body() order: OrderDto) {
  const result = await this.payments.process(order)

  if (!result.success) {
    // Logged at WARN level (402 is 4xx)
    throw new PaymentFailedException(result.error)
  }

  return result
}
```

This allows you to create rich, domain-specific exceptions that integrate seamlessly with the exception handler without coupling to NestJS's `HttpException` class.

Exceptions without `getStatus()` and `getResponse()` methods are automatically treated as 500 Internal Server Error.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

## Links

- [npm package](https://www.npmjs.com/package/@neoma/exception-handling)
- [GitHub repository](https://github.com/shipdventures/neoma-exception-handling)
- [Issue tracker](https://github.com/shipdventures/neoma-exception-handling/issues)
- [Neoma ecosystem](https://github.com/shipdventures/neoma)

## Part of the Neoma Ecosystem

This package is part of the Neoma ecosystem of Laravel-inspired NestJS packages:

- [@neoma/config](https://github.com/shipdventures/neoma-config) - Type-safe environment configuration
- [@neoma/logger](https://github.com/shipdventures/neoma-logger) - Request and application logging
- **@neoma/exception-handling** - Global exception handling (you are here)
- More coming soon...

Each package works independently but integrates seamlessly for a complete Laravel-like experience in NestJS.
