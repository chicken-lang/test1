import { AdminController } from './admin.controller.js'
import { AdminService } from './admin.service.js'

function createMockAdminService() {
  return {
    findAll: jest.fn().mockResolvedValue({
      list: [
        { id: 1, username: 'admin1', nickname: '管理员1', role: 'system_admin', bindColumnIds: [] },
        { id: 2, username: 'editor1', nickname: '编辑1', role: 'editor', bindColumnIds: [1, 2] },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    }),
    findOne: jest.fn().mockResolvedValue({ id: 1, username: 'admin1', role: 'system_admin' }),
    create: jest.fn().mockResolvedValue({ id: 100, username: 'newadmin' }),
    update: jest.fn().mockResolvedValue({ id: 1, username: 'admin1' }),
    updateRoleAndColumns: jest.fn().mockResolvedValue(undefined),
    toggleFreeze: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    softDelete: jest.fn().mockResolvedValue(undefined),
    batchBindColumns: jest.fn().mockResolvedValue(undefined),
  }
}

describe('AdminController', () => {
  let controller: AdminController
  let adminService: ReturnType<typeof createMockAdminService>

  beforeEach(() => {
    jest.clearAllMocks()
    adminService = createMockAdminService()
    controller = new AdminController(adminService as any)
  })

  describe('findAll', () => {
    it('应返回管理员列表', async () => {
      const result = await controller.findAll({ page: 1, pageSize: 10 })

      expect(result.code).toBe(0)
      expect(result.data.list.length).toBe(2)
      expect(adminService.findAll).toHaveBeenCalledWith({ page: 1, pageSize: 10 })
    })

    it('应支持过滤参数', async () => {
      await controller.findAll({ role: 'editor', status: 'active', keyword: 'test' })

      expect(adminService.findAll).toHaveBeenCalledWith({ role: 'editor', status: 'active', keyword: 'test' })
    })
  })

  describe('findOne', () => {
    it('应返回管理员详情', async () => {
      const result = await controller.findOne('1')

      expect(result.code).toBe(0)
      expect(result.data).not.toBeNull()
      expect(result.data!.id).toBe(1)
      expect(result.data!.username).toBe('admin1')
      expect(adminService.findOne).toHaveBeenCalledWith(1)
    })

    it('管理员不存在应返回错误', async () => {
      adminService.findOne = jest.fn().mockResolvedValue(null)

      const result = await controller.findOne('999')

      expect(result.code).toBe(40401)
      expect(result.message).toBe('账号不存在')
    })
  })

  describe('create', () => {
    it('应成功创建管理员账号', async () => {
      const mockUser = { id: 999, username: 'operator' }
      const createDto = {
        username: 'newadmin',
        password: 'password',
        nickname: '新管理员',
        role: 'editor',
        bindColumnIds: [1, 2],
        email: 'new@example.com',
      }

      const result = await controller.create(createDto, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('账号创建成功')
      expect(result.data.username).toBe('newadmin')
      expect(adminService.create).toHaveBeenCalledWith({
        ...createDto,
        operatorId: 999,
        operatorUsername: 'operator',
      })
    })
  })

  describe('update', () => {
    it('应成功更新管理员信息', async () => {
      const mockUser = { id: 1, username: 'admin1' }
      const updateDto = { nickname: '新昵称', email: 'new@example.com' }

      const result = await controller.update('1', updateDto, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('更新成功')
      expect(adminService.update).toHaveBeenCalledWith(1, updateDto, 1, 'admin1')
    })
  })

  describe('updateRole', () => {
    it('应成功更新角色和栏目权限', async () => {
      const mockUser = { id: 999, username: 'admin' }
      const updateRoleDto = { role: 'reviewer', bindColumnIds: [1, 2, 3] }

      const result = await controller.updateRole('1', updateRoleDto, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('角色权限已更新,目标账号需重新登录')
      expect(adminService.updateRoleAndColumns).toHaveBeenCalledWith(1, 'reviewer', [1, 2, 3], 999, 'admin')
    })
  })

  describe('toggleFreeze', () => {
    it('应成功冻结账号', async () => {
      const mockUser = { id: 1, username: 'admin1' }

      const result = await controller.toggleFreeze('1', { freeze: true }, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('已冻结')
      expect(adminService.toggleFreeze).toHaveBeenCalledWith(1, true, 1, 'admin1')
    })

    it('应成功解冻账号', async () => {
      const mockUser = { id: 1, username: 'admin1' }

      const result = await controller.toggleFreeze('1', { freeze: false }, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('已解冻')
      expect(adminService.toggleFreeze).toHaveBeenCalledWith(1, false, 1, 'admin1')
    })
  })

  describe('resetPassword', () => {
    it('应成功重置密码', async () => {
      const mockUser = { id: 999, username: 'admin' }

      const result = await controller.resetPassword('1', { newPassword: 'newpassword' }, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('密码已重置')
      expect(adminService.resetPassword).toHaveBeenCalledWith(1, 'newpassword', 999, 'admin')
    })
  })

  describe('softDelete', () => {
    it('应成功删除账号', async () => {
      const mockUser = { id: 1, username: 'admin1' }

      const result = await controller.softDelete('1', mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('账号已删除')
      expect(adminService.softDelete).toHaveBeenCalledWith(1, 1, 'admin1')
    })
  })

  describe('batchBindColumns', () => {
    it('应成功批量分配栏目权限', async () => {
      const mockUser = { id: 999, username: 'admin' }

      const result = await controller.batchBindColumns({ adminIds: [1, 2], bindColumnIds: [10, 20] }, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('批量分配完成')
      expect(adminService.batchBindColumns).toHaveBeenCalledWith([1, 2], [10, 20], 999, 'admin')
    })
  })
})
