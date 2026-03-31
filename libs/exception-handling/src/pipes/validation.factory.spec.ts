import { faker } from "@faker-js/faker"
import { BadRequestException } from "@nestjs/common"
import { IsEmail, MinLength, validate } from "class-validator"
import { validationFactory } from "./validation.factory"

const { hacker, internet, string } = faker
const nameMessage = hacker.phrase()
const emailMessage = hacker.phrase()

class TestDto {
  @MinLength(5, { message: nameMessage })
  public name!: string

  @IsEmail({}, { message: emailMessage })
  public email!: string
}

describe("validationFactory", () => {
  describe("When it is called with a validation error", () => {
    it("should map the value and error to the name of its property", async () => {
      const invalidName = string.alphanumeric(4)
      const dto = Object.assign(new TestDto(), {
        name: invalidName,
        email: internet.email(),
      })

      const errors = await validate(dto)

      const error = validationFactory(errors)
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.getResponse()).toMatchObject({
        name: {
          value: invalidName,
          error: nameMessage,
        },
      })
    })
  })

  describe("When it is called with multiple validation errors", () => {
    it("should map the value and error to the name of each property that the errors represent", async () => {
      const invalidName = string.alphanumeric(4)
      const invalidEmail = string.alphanumeric(4)
      const dto = Object.assign(new TestDto(), {
        name: invalidName,
        email: invalidEmail,
      })

      const errors = await validate(dto)

      const error = validationFactory(errors)
      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.getResponse()).toMatchObject({
        name: {
          value: invalidName,
          error: nameMessage,
        },
        email: {
          value: invalidEmail,
          error: emailMessage,
        },
      })
    })
  })
})
