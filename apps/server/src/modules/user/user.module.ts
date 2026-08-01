import { Module } from '@nestjs/common'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'
import { FeedbackController } from './feedback.controller.js'

@Module({
  controllers: [UserController, FeedbackController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
