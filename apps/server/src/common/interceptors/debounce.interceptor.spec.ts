import { Test, TestingModule } from '@nestjs/testing';
import { DebounceInterceptor } from './debounce.interceptor.js';
import { RedisService } from '../../modules/cache/redis.service.js';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable, of } from 'rxjs';

describe('DebounceInterceptor', () => {
  let interceptor: DebounceInterceptor;
  let redisService: any;

  beforeEach(async () => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebounceInterceptor,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    interceptor = module.get<DebounceInterceptor>(DebounceInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should skip debounce for GET requests', async () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: () => of('response'),
      };

      const result$ = await interceptor.intercept(mockContext, mockNext);
      result$.subscribe((result) => {
        expect(result).toBe('response');
      });

      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('should allow first POST request', async () => {
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        user: { id: 1 },
      };

      redisService.get.mockResolvedValue(null);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: () => of('response'),
      };

      const result$ = await interceptor.intercept(mockContext, mockNext);
      result$.subscribe((result) => {
        expect(result).toBe('response');
      });

      expect(redisService.get).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when request is too frequent', async () => {
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        user: { id: 1 },
      };

      // 返回1秒前的时间（在3秒防抖窗口内）
      redisService.get.mockResolvedValue((Date.now() - 1000).toString());

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: () => of('response'),
      };

      await expect(interceptor.intercept(mockContext, mockNext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow request after debounce window', async () => {
      const mockReq = {
        method: 'POST',
        path: '/api/test',
        user: { id: 1 },
      };

      // 返回5秒前的时间（超过3秒防抖窗口）
      redisService.get.mockResolvedValue((Date.now() - 5000).toString());

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
        }),
      } as unknown as ExecutionContext;

      const mockNext = {
        handle: () => of('response'),
      };

      const result$ = await interceptor.intercept(mockContext, mockNext);
      result$.subscribe((result) => {
        expect(result).toBe('response');
      });

      expect(redisService.set).toHaveBeenCalled();
    });
  });
});
