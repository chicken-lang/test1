import { Test, TestingModule } from '@nestjs/testing';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerPreset, THROTTLER_PRESETS } from './throttler.constants.js';

describe('LoginThrottlerGuard', () => {
  let guard: LoginThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              name: ThrottlerPreset.STRICT,
              ttl: THROTTLER_PRESETS[ThrottlerPreset.STRICT].ttl,
              limit: THROTTLER_PRESETS[ThrottlerPreset.STRICT].limit,
            },
          ],
        }),
      ],
      providers: [LoginThrottlerGuard],
    }).compile();

    guard = module.get<LoginThrottlerGuard>(LoginThrottlerGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('getTracker', () => {
    it('should return username-based key when username is provided', async () => {
      const mockReq = {
        body: { username: 'testuser' },
        ip: '127.0.0.1',
      };

      // @ts-expect-error - testing protected method
      const result = await guard.getTracker(mockReq);
      expect(result).toBe('login:testuser');
    });

    it('should return IP-based key when username is not provided', async () => {
      const mockReq = {
        body: {},
        ip: '127.0.0.1',
      };

      // @ts-expect-error - testing protected method
      const result = await guard.getTracker(mockReq);
      expect(result).toBe('127.0.0.1');
    });

    it('should fallback to unknown when no ip available', async () => {
      const mockReq = {
        body: {},
      };

      // @ts-expect-error - testing protected method
      const result = await guard.getTracker(mockReq);
      expect(result).toBe('unknown');
    });
  });
});
