import { Test } from "@nestjs/testing"
import { ExceptionHandlerModule } from "@lib"

describe("ExceptionHandlerModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
      imports: [ExceptionHandlerModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module).toBeInstanceOf(Object)
  })
})
