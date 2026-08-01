import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface.js';
import { THROTTLE_MESSAGES, ThrottlerPreset } from './throttler.constants.js';

/**
 * 登录专用限流守卫
 * - 优先按用户名限流（防暴力破解）
 * - 降级为 IP 限流（防分布式攻击）
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 登录接口按用户名限流
    const username = req.body?.username || req.query?.username || '';
    if (username) {
      return `login:${username}`;
    }
    // 降级为 IP 限流
    return req.ip || req.ips?.[0] || 'unknown';
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const message = THROTTLE_MESSAGES[ThrottlerPreset.STRICT];
    throw new ThrottlerException(message);
  }
}
