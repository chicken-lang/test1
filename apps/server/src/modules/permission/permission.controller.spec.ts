import { PermissionController } from './permission.controller.js'
import { PermissionService } from './permission.service.js'

function createMockPermissionService() {
  return {
    getAllRolePermissions: jest.fn().mockResolvedValue([
      { role: 'system_admin', roleName: '系统管理员', permissions: ['article_create'] },
      { role: 'editor', roleName: '编辑', permissions: ['article_create'] },
    ]),
    getRolePermissions: jest.fn().mockResolvedValue({ role: 'editor', roleName: '编辑', permissions: ['article_create'] }),
    updateRolePermissions: jest.fn().mockResolvedValue({ role: 'editor', permissions: ['article_create', 'article_update'], affectedAdminCount: 2 }),
  }
}

describe('PermissionController', () => {
  let controller: PermissionController
  let permissionService: ReturnType<typeof createMockPermissionService>

  beforeEach(() => {
    jest.clearAllMocks()
    permissionService = createMockPermissionService()
    controller = new PermissionController(permissionService as any)
  })

  describe('getAll', () => {
    it('应返回所有角色权限', async () => {
      const result = await controller.getAll()

      expect(result.code).toBe(0)
      expect(result.data.length).toBe(2)
      expect(result.data[0].role).toBe('system_admin')
      expect(permissionService.getAllRolePermissions).toHaveBeenCalled()
    })
  })

  describe('getByRole', () => {
    it('应返回指定角色的权限', async () => {
      const result = await controller.getByRole('editor')

      expect(result.code).toBe(0)
      expect(result.data).not.toBeNull()
      expect(result.data!.role).toBe('editor')
      expect(permissionService.getRolePermissions).toHaveBeenCalledWith('editor')
    })

    it('角色不存在应返回错误', async () => {
      permissionService.getRolePermissions = jest.fn().mockResolvedValue(null)

      const result = await controller.getByRole('non-existent')

      expect(result.code).toBe(40401)
      expect(result.message).toBe('角色不存在')
    })
  })

  describe('update', () => {
    it('应成功更新角色权限', async () => {
      const mockUser = { id: 999, username: 'admin' }

      const result = await controller.update('editor', { permissions: ['article_create', 'article_update'] }, mockUser)

      expect(result.code).toBe(0)
      expect(result.message).toBe('角色权限已更新,对应角色账号需重新登录')
      expect(permissionService.updateRolePermissions).toHaveBeenCalledWith('editor', ['article_create', 'article_update'], 999, 'admin')
    })
  })
})
