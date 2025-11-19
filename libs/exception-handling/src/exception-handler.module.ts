import { Module } from "@nestjs/common"
import { NeomaExceptionFilter } from "./filters/exception.filter"
import { APP_FILTER } from "@nestjs/core"

/**
 * Example module - replace with your package's module(s).
 */
@Module({
  providers: [{ provide: APP_FILTER, useClass: NeomaExceptionFilter }],
  exports: [],
})
export class ExceptionHandlerModule {}
