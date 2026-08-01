import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../../modules/cache/redis.service.js';

const DEBOUNCE_TTL = 3000; // 3秒防抖

@Injectable()
export class DebounceInterceptor implements NestInterceptor {
  constructor(@Inject(RedisService) private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // 只对 POST/PUT/PATCH/DELETE 请求进行防抖
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // 获取用户标识（优先使用已登录用户ID，降级为IP）
    const userId = request.user?.id || request.user?.userId;
    let key: string;
    
    if (userId) {
      // 已登录用户：按用户ID + 请求路径
      key = `debounce:user:${userId}:${request.path}`;
    } else {
      // 未登录用户：按IP + 请求路径
      const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      key = `debounce:ip:${ip}:${request.path}`;
    }

    // 检查是否在防抖时间内
    const lastSubmitTime = await this.redisService.get(key);
    if (lastSubmitTime) {
      const elapsed = Date.now() - parseInt(lastSubmitTime, 10);
      if (elapsed < DEBOUNCE_TTL) {
        const remaining = Math.ceil((DEBOUNCE_TTL - elapsed) / 1000);
        throw new ForbiddenException(`操作过于频繁，请${remaining}秒后再试`);
      }
    }

    // 更新最后提交时间
    await this.redisService.set(key, Date.now().toString(), DEBOUNCE_TTL);

    return next.handle();
  }
}
