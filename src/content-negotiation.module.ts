import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  InternalServerErrorException,
  Module,
  NotFoundException,
  Post,
  Query,
} from "@nestjs/common"
import { IsEmail, MinLength } from "class-validator"
import { ExceptionHandlerModule, ErrorTemplate, NeomaException } from "@lib"

class RedirectableException extends Error implements NeomaException {
  public constructor() {
    super("Unauthenticated")
    this.name = "RedirectableException"
  }

  public getStatus(): number {
    return HttpStatus.UNAUTHORIZED
  }

  public getResponse(): object {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: "Unauthenticated",
      error: "Unauthorized",
    }
  }

  public getRedirect(): { status: number; url: string } {
    return { status: HttpStatus.SEE_OTHER, url: "/login" }
  }
}

class MalformedRedirectException extends Error implements NeomaException {
  public constructor() {
    super("Bad redirect")
    this.name = "MalformedRedirectException"
  }

  public getStatus(): number {
    return HttpStatus.UNAUTHORIZED
  }

  public getResponse(): object {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: "Unauthorized",
      error: "Unauthorized",
    }
  }

  public getRedirect(): any {
    return undefined
  }
}

class TestDto {
  @MinLength(5, { message: "Name must be at least 5 characters" })
  public name!: string

  @IsEmail({}, { message: "Email must be a valid email address" })
  public email!: string
}

@Controller()
class ContentNegotiationController {
  @ErrorTemplate("error")
  @Post("with-template")
  public withTemplate(): void {
    throw new NotFoundException("Not found")
  }

  @ErrorTemplate({ default: "error" })
  @Post("with-default-template")
  public withDefaultTemplate(): void {
    throw new NotFoundException("Not found")
  }

  @ErrorTemplate({
    BadRequestException: "bad-request",
    InternalServerErrorException: "server-error",
    default: "error",
  })
  @Post("with-multi-template")
  public withMultiTemplate(@Query("type") type: string): void {
    switch (type) {
      case "bad-request":
        throw new BadRequestException("Bad request")
      case "server-error":
        throw new InternalServerErrorException("Server error")
      default:
        throw new Error("Unhandled error")
    }
  }

  @Post("without-template")
  public withoutTemplate(): void {
    throw new BadRequestException("Bad request")
  }

  @ErrorTemplate("error")
  @Post("with-template-and-validation")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public withTemplateAndValidation(@Body() _dto: TestDto): void {
    return
  }

  @ErrorTemplate("with-locals", {
    formAction: "/auth/magic-link",
    pageTitle: "Sign In",
  })
  @Post("with-template-and-locals")
  public withTemplateAndLocals(): void {
    throw new BadRequestException("Invalid credentials")
  }

  @ErrorTemplate(
    {
      BadRequestException: "with-locals",
      default: "error",
    },
    { formAction: "/checkout", pageTitle: "Checkout" },
  )
  @Post("with-multi-template-and-locals")
  public withMultiTemplateAndLocals(@Query("type") type: string): void {
    switch (type) {
      case "bad-request":
        throw new BadRequestException("Validation failed")
      default:
        throw new Error("Unhandled error")
    }
  }

  @Post("with-redirect")
  public withRedirect(): void {
    throw new RedirectableException()
  }

  @Post("with-malformed-redirect")
  public withMalformedRedirect(): void {
    throw new MalformedRedirectException()
  }

  @ErrorTemplate("error")
  @Post("with-redirect-and-template")
  public withRedirectAndTemplate(): void {
    throw new RedirectableException()
  }
}

@Module({
  imports: [ExceptionHandlerModule],
  controllers: [ContentNegotiationController],
})
export class ContentNegotiationModule {}
