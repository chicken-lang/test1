import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { InquiryController, AdminInquiryController } from './inquiry.controller.js'
import { InquiryService } from './inquiry.service.js'
import { SensitiveWordModule } from '../sensitive-word/sensitive-word.module.js'
import { MessageModule } from '../message/message.module.js'

@Module({
  imports: [SensitiveWordModule, MessageModule],
  controllers: [InquiryController, AdminInquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule implements OnModuleInit, OnModuleDestroy {
  private timeoutTimer: NodeJS.Timeout | null = null

  constructor(private readonly inquiryService: InquiryService) {}

  /**
   * 模块初始化时启动超时检查定时任务
   */
  async onModuleInit() {
    // 启动定时任务: 每 30 分钟执行一次超时检查
    this.timeoutTimer = setInterval(async () => {
      try {
        await this.inquiryService.checkTimeout()
      } catch (err) {
        // 定时任务出错不影响主流程
      }
    }, 30 * 60 * 1000)

    // 启动时立即执行一次
    try {
      await this.inquiryService.checkTimeout()
    } catch {
      // 启动时检查失败不影响模块加载
    }
  }

  /**
   * 模块销毁时清理定时器
   */
  onModuleDestroy() {
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer)
      this.timeoutTimer = null
    }
  }
}
