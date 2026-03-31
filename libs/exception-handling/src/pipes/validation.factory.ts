import { BadRequestException, ValidationError } from "@nestjs/common"

/**
 * A factory to be used with the ValidationPipe that takes an array of
 * validation errors and returns a BadRequestException with a transformed
 * error response.
 *
 * When a {@link BadRequestException} is thrown it usually has an array of error
 * messages, but this factory transforms an array of {@link ValidationError} into
 * an object with each property as the name of the field that failed validation.
 *
 * @example
 *
 * If the validation error array is:
 * [
 *   ValidationError {
 *     target: TestDto { name: 'FM9u', email: 'zHep' },
 *     value: 'FM9u',
 *     property: 'name',
 *     children: [],
 *     constraints: { minLength: 'We need to generate the haptic USB system!' }
 *   },
 *   ValidationError {
 *     target: TestDto { name: 'FM9u', email: 'zHep' },
 *     value: 'zHep',
 *     property: 'email',
 *     children: [],
 *     constraints: {
 *       isEmail: "quantifying the matrix won't do anything, we need to program the back-end API capacitor!"
 *     }
 *   }
 * ]
 *
 * It will be transformed into:
 * {
 *   name: {
 *     value: 'FM9u',
 *     error: 'We need to generate the haptic USB system!'
 *   },
 *   email: {
 *     value: 'zHep',
 *     error: 'quantifying the matrix won't do anything, we need to program the back-end API capacitor!'
 *   }
 * }
 *
 * before being passed to the {@link BadRequestException} constructor and
 * returned.
 *
 * @param errors The array of errors to transform.
 * @returns A {@link BadRequestException} with a transformed error response.
 */
export const validationFactory = (
  errors: Array<ValidationError>,
): BadRequestException => {
  const transformed = errors.reduce(
    (
      acc: Record<string, unknown>,
      error: ValidationError,
    ): Record<string, unknown> => {
      const { constraints, property, value } = error
      acc[property] = {
        value,
        error: Object.values(constraints!)[0],
      }
      return acc
    },
    {},
  )

  return new BadRequestException(transformed)
}
