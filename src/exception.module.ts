import { Module } from "@nestjs/common"
import { AppController } from "./app.controller"
import { ExceptionHandlerModule } from "@lib"

@Module({
  imports: [ExceptionHandlerModule],
  controllers: [AppController],
})
export class ExceptionModule {}
