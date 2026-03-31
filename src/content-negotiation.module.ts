import {
  BadRequestException,
  Body,
  Controller,
  Module,
  NotFoundException,
  Post,
} from "@nestjs/common"
import { IsEmail, MinLength } from "class-validator"
import { ExceptionHandlerModule, ErrorTemplate } from "@lib"

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
}

@Module({
  imports: [ExceptionHandlerModule],
  controllers: [ContentNegotiationController],
})
export class ContentNegotiationModule {}
