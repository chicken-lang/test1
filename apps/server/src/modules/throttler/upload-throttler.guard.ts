import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface.js';
import { THROTTLE_MESSAGES, ThrottlerPreset } from './throttler.constants.js';

/**
 * 文件上传专用限流守卫
 * - 按用户 ID 限流，防止单用户大量上传
 */
@Injectable()
export class UploadThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 按用户 ID 限流（上传必须登录）
    const userId = req.user?.id || req.body?.userId || '';
    if (userId) {
      return `upload:user:${userId}`;
    }
    // 降级为 IP 限流
    return `upload:ip:${req.ip || req.ips?.[0] || 'unknown'}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException(THROTTLE_MESSAGES[ThrottlerPreset.DEFAULT]);
  }
}
