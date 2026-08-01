import { Module } from '@nestjs/common'
import { ColumnController } from './column.controller.js'
import { ColumnService } from './column.service.js'

@Module({
  controllers: [ColumnController],
  providers: [ColumnService],
  exports: [ColumnService],
})
export class ColumnModule {}
