import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import { ChangePasswordDto } from './dto/change-password.dto.js'

function createMockAuthService() {
  return {
    login: jest.fn().mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 8 * 60 * 60,
      user: { id: 1, username: 'admin', role: 'system_admin' },
      permissions: ['article_create'],
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
    ssoLogin: jest.fn().mockResolvedValue({
      token: 'jwt-token',
      expiresIn: 8 * 60 * 60,
      user: { id: 1, username: '张三', role: '', ssoUserType: 'student' },
      permissions: [],
    }),
  }
}

function createMockSsoService() {
  return {
    handleCallback: jest.fn().mockResolvedValue({
      user: { userId: 1, name: '张三', ssoUserType: 'student', role: '' },
      isAdmin: false,
      bindingRequired: false,
      userType: 'sso',
    }),
  }
}

describe('AuthController', () => {
  let controller: AuthController
  let authService: ReturnType<typeof createMockAuthService>
  let ssoService: ReturnType<typeof createMockSsoService>

  beforeEach(() => {
    jest.clearAllMocks()
    authService = createMockAuthService()
    ssoService = createMockSsoService()
    controller = new AuthController(authService as any, ssoService as any)
  })

  describe('login', () => {
    it('应成功登录并返回用户信息', async () => {
      const loginDto: LoginDto = { username: 'admin', password: 'password', keyVersion: 'v1' }
      const mockReq = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      }

      const result = await controller.login(loginDto, mockReq)

      expect(result.code).toBe(0)
      expect(result.message).toBe('登录成功')
      expect(result.data.token).toBe('jwt-token')
      expect(result.data.user.username).toBe('admin')
      expect(authService.login).toHaveBeenCalledWith('admin', 'password', 'v1', '127.0.0.1', 'test-agent')
    })

    it('登录应传递正确的 IP 和 User-Agent', async () => {
      const loginDto: LoginDto = { username: 'admin', password: 'password' }
      const mockReq = {
        ip: '192.168.1.100',
        headers: { 'user-agent': 'Mozilla/5.0' },
      }

      await controller.login(loginDto, mockReq)

      expect(authService.login).toHaveBeenCalledWith('admin', 'password', undefined, '192.168.1.100', 'Mozilla/5.0')
    })

    it('无 keyVersion 时应使用兼容流程', async () => {
      const loginDto: LoginDto = { username: 'admin', password: 'sha256-hash' }
      const mockReq = { ip: '', headers: {} }

      await controller.login(loginDto, mockReq)

      expect(authService.login).toHaveBeenCalledWith('admin', 'sha256-hash', undefined, '', '')
    })
  })

  describe('logout', () => {
    it('应成功退出登录', async () => {
      const result = await controller.logout('Bearer jwt-token', { id: 1, username: 'admin' })

      expect(result.code).toBe(0)
      expect(result.message).toBe('退出成功')
      expect(authService.logout).toHaveBeenCalledWith('jwt-token', 1)
    })

    it('应正确提取 Token', async () => {
      await controller.logout('Bearer my-token', { id: 1 })

      expect(authService.logout).toHaveBeenCalledWith('my-token', 1)
    })
  })

  describe('changePassword', () => {
    it('应成功修改密码', async () => {
      const changePasswordDto: ChangePasswordDto = { oldPassword: 'old', newPassword: 'new', keyVersion: 'v1' }
      const mockUser = { id: 1, username: 'admin' }

      const result = await controller.changePassword(changePasswordDto, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('密码修改成功,请重新登录')
      expect(authService.changePassword).toHaveBeenCalledWith(1, 'old', 'new', 'v1')
    })

    it('兼容流程无 keyVersion', async () => {
      const changePasswordDto: ChangePasswordDto = { oldPassword: 'old-sha256', newPassword: 'new-sha256' }
      const mockUser = { id: 1 }

      await controller.changePassword(changePasswordDto, mockUser)

      expect(authService.changePassword).toHaveBeenCalledWith(1, 'old-sha256', 'new-sha256', undefined)
    })
  })
})
