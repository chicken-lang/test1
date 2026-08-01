import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface.js';
import { THROTTLE_MESSAGES, ThrottlerPreset } from './throttler.constants.js';

/**
 * 搜索专用限流守卫
 * - 按用户身份（token）或 IP 限流
 * - 防止搜索接口被滥用
 */
@Injectable()
export class SearchThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 优先按 token 限流（已登录用户）
    const token = req.headers?.authorization?.replace('Bearer ', '') || '';
    if (token) {
      return `search:token:${token.slice(0, 16)}`;
    }
    // 降级为 IP 限流
    return `search:ip:${req.ip || req.ips?.[0] || 'unknown'}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException(THROTTLE_MESSAGES[ThrottlerPreset.RELAXED]);
  }
}
