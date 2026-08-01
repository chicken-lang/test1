import {
  AccessLevel,
  SecretLevel,
  FileStatus,
  FileCategory,
  PreviewMode,
  DeviceType,
  FileAuditAction,
  EXECUTABLE_BLACKLIST,
  PREVIEWABLE_FORMATS,
  IMAGE_FORMATS,
  DOCUMENT_FORMATS,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_DAILY_DOWNLOAD_LIMIT,
  DEFAULT_ANONYMOUS_RATE_LIMIT,
  PREVIEW_CACHE_PATH,
  FILE_STORAGE_PATH,
  AUTO_ARCHIVE_DAYS,
  ROLE_FILE_PERMISSIONS,
} from './file-resource.constants.js'

describe('FileResource Constants', () => {
  // ==================== AccessLevel ====================
  describe('AccessLevel', () => {
    it('应包含 PUBLIC, CAMPUS, INTERNAL 三个级别', () => {
      expect(AccessLevel.PUBLIC).toBe('PUBLIC')
      expect(AccessLevel.CAMPUS).toBe('CAMPUS')
      expect(AccessLevel.INTERNAL).toBe('INTERNAL')
    })

    it('应恰好有 3 个枚举值', () => {
      const values = Object.values(AccessLevel)
      expect(values).toHaveLength(3)
    })
  })

  // ==================== SecretLevel ====================
  describe('SecretLevel', () => {
    it('应包含 NORMAL 和 CONFIDENTIAL 两个级别', () => {
      expect(SecretLevel.NORMAL).toBe('NORMAL')
      expect(SecretLevel.CONFIDENTIAL).toBe('CONFIDENTIAL')
    })

    it('应恰好有 2 个枚举值', () => {
      const values = Object.values(SecretLevel)
      expect(values).toHaveLength(2)
    })
  })

  // ==================== FileStatus ====================
  describe('FileStatus', () => {
    it('应包含 ACTIVE, ARCHIVED, DELETED 三个状态', () => {
      expect(FileStatus.ACTIVE).toBe('ACTIVE')
      expect(FileStatus.ARCHIVED).toBe('ARCHIVED')
      expect(FileStatus.DELETED).toBe('DELETED')
    })

    it('应恰好有 3 个状态值', () => {
      const values = Object.values(FileStatus)
      expect(values).toHaveLength(3)
    })
  })

  // ==================== FileCategory ====================
  describe('FileCategory', () => {
    it('应包含全部 7 个分类', () => {
      expect(FileCategory.NOTICE).toBe('notice')
      expect(FileCategory.MATERIAL).toBe('material')
      expect(FileCategory.TEMPLATE).toBe('template')
      expect(FileCategory.FORM).toBe('form')
      expect(FileCategory.POLICY).toBe('policy')
      expect(FileCategory.MEETING).toBe('meeting')
      expect(FileCategory.OTHER).toBe('other')
    })

    it('应恰好有 7 个分类', () => {
      const values = Object.values(FileCategory)
      expect(values).toHaveLength(7)
    })

    it('所有枚举值应为小写', () => {
      for (const val of Object.values(FileCategory)) {
        expect(val).toBe(val.toLowerCase())
      }
    })
  })

  // ==================== PreviewMode ====================
  describe('PreviewMode', () => {
    it('应包含 FULL 和 THUMBNAIL', () => {
      expect(PreviewMode.FULL).toBe('full')
      expect(PreviewMode.THUMBNAIL).toBe('thumbnail')
    })
  })

  // ==================== DeviceType ====================
  describe('DeviceType', () => {
    it('应包含 DESKTOP 和 MOBILE', () => {
      expect(DeviceType.DESKTOP).toBe('desktop')
      expect(DeviceType.MOBILE).toBe('mobile')
    })
  })

  // ==================== FileAuditAction ====================
  describe('FileAuditAction', () => {
    it('应包含全部审计动作', () => {
      expect(FileAuditAction.UPLOAD).toBe('file_upload')
      expect(FileAuditAction.EDIT).toBe('file_edit')
      expect(FileAuditAction.DELETE).toBe('file_delete')
      expect(FileAuditAction.PHYSICAL_DELETE).toBe('file_physical_delete')
      expect(FileAuditAction.ARCHIVE).toBe('file_archive')
      expect(FileAuditAction.PERMISSION_UPDATE).toBe('file_permission_update')
      expect(FileAuditAction.PREVIEW).toBe('file_preview')
      expect(FileAuditAction.DOWNLOAD).toBe('file_download')
    })

    it('应恰好有 8 个审计动作', () => {
      const values = Object.values(FileAuditAction)
      expect(values).toHaveLength(8)
    })
  })

  // ==================== EXECUTABLE_BLACKLIST ====================
  describe('EXECUTABLE_BLACKLIST', () => {
    it('应包含常见可执行文件扩展名', () => {
      expect(EXECUTABLE_BLACKLIST).toContain('.exe')
      expect(EXECUTABLE_BLACKLIST).toContain('.bat')
      expect(EXECUTABLE_BLACKLIST).toContain('.sh')
      expect(EXECUTABLE_BLACKLIST).toContain('.cmd')
      expect(EXECUTABLE_BLACKLIST).toContain('.ps1')
      expect(EXECUTABLE_BLACKLIST).toContain('.com')
      expect(EXECUTABLE_BLACKLIST).toContain('.jar')
      expect(EXECUTABLE_BLACKLIST).toContain('.msi')
      expect(EXECUTABLE_BLACKLIST).toContain('.vbs')
    })

    it('所有扩展名应以点号开头', () => {
      for (const ext of EXECUTABLE_BLACKLIST) {
        expect(ext.startsWith('.')).toBe(true)
      }
    })

    it('所有扩展名应为小写', () => {
      for (const ext of EXECUTABLE_BLACKLIST) {
        expect(ext).toBe(ext.toLowerCase())
      }
    })

    it('应至少包含 10 项', () => {
      expect(EXECUTABLE_BLACKLIST.length).toBeGreaterThanOrEqual(10)
    })
  })

  // ==================== PREVIEWABLE_FORMATS ====================
  describe('PREVIEWABLE_FORMATS', () => {
    it('应包含所有文档格式', () => {
      for (const fmt of DOCUMENT_FORMATS) {
        expect(PREVIEWABLE_FORMATS).toContain(fmt)
      }
    })

    it('应包含所有图片格式', () => {
      for (const fmt of IMAGE_FORMATS) {
        expect(PREVIEWABLE_FORMATS).toContain(fmt)
      }
    })

    it('应包含 pdf 格式', () => {
      expect(PREVIEWABLE_FORMATS).toContain('pdf')
    })

    it('所有格式应为小写', () => {
      for (const fmt of PREVIEWABLE_FORMATS) {
        expect(fmt).toBe(fmt.toLowerCase())
      }
    })
  })

  describe('DOCUMENT_FORMATS', () => {
    it('应包含常见文档格式', () => {
      expect(DOCUMENT_FORMATS).toContain('doc')
      expect(DOCUMENT_FORMATS).toContain('docx')
      expect(DOCUMENT_FORMATS).toContain('xls')
      expect(DOCUMENT_FORMATS).toContain('xlsx')
      expect(DOCUMENT_FORMATS).toContain('ppt')
      expect(DOCUMENT_FORMATS).toContain('pptx')
    })

    it('不包含 pdf (pdf 单独处理)', () => {
      expect(DOCUMENT_FORMATS).not.toContain('pdf')
    })
  })

  describe('IMAGE_FORMATS', () => {
    it('应包含常见图片格式', () => {
      expect(IMAGE_FORMATS).toContain('jpg')
      expect(IMAGE_FORMATS).toContain('jpeg')
      expect(IMAGE_FORMATS).toContain('png')
      expect(IMAGE_FORMATS).toContain('gif')
      expect(IMAGE_FORMATS).toContain('bmp')
      expect(IMAGE_FORMATS).toContain('tiff')
    })
  })

  // ==================== 数值常量 ====================
  describe('数值常量', () => {
    it('DEFAULT_MAX_FILE_SIZE 应为 100MB', () => {
      expect(DEFAULT_MAX_FILE_SIZE).toBe(100 * 1024 * 1024)
    })

    it('DEFAULT_DAILY_DOWNLOAD_LIMIT 应为 100', () => {
      expect(DEFAULT_DAILY_DOWNLOAD_LIMIT).toBe(100)
    })

    it('DEFAULT_ANONYMOUS_RATE_LIMIT 应为 10', () => {
      expect(DEFAULT_ANONYMOUS_RATE_LIMIT).toBe(10)
    })

    it('AUTO_ARCHIVE_DAYS 应为 180', () => {
      expect(AUTO_ARCHIVE_DAYS).toBe(180)
    })
  })

  // ==================== 路径常量 ====================
  describe('路径常量', () => {
    it('PREVIEW_CACHE_PATH 应正确', () => {
      expect(PREVIEW_CACHE_PATH).toBe('/preview_cache')
    })

    it('FILE_STORAGE_PATH 应正确', () => {
      expect(FILE_STORAGE_PATH).toBe('/file_resources')
    })
  })

  // ==================== ROLE_FILE_PERMISSIONS ====================
  describe('ROLE_FILE_PERMISSIONS', () => {
    it('应包含全部 4 个角色', () => {
      expect(Object.keys(ROLE_FILE_PERMISSIONS)).toEqual(
        expect.arrayContaining(['editor', 'reviewer', 'column_admin', 'system_admin']),
      )
    })

    it('editor 应有上传权限', () => {
      expect(ROLE_FILE_PERMISSIONS.editor.upload).toBe(true)
    })

    it('editor 应有编辑权限', () => {
      expect(ROLE_FILE_PERMISSIONS.editor.edit).toBe(true)
    })

    it('editor 不应有删除权限', () => {
      expect(ROLE_FILE_PERMISSIONS.editor.delete).toBe(false)
    })

    it('editor 不应有物理删除权限', () => {
      expect(ROLE_FILE_PERMISSIONS.editor.physicalDelete).toBe(false)
    })

    it('editor 应有配置权限', () => {
      expect(ROLE_FILE_PERMISSIONS.editor.configPermission).toBe(true)
    })

    it('reviewer 应有上传权限', () => {
      expect(ROLE_FILE_PERMISSIONS.reviewer.upload).toBe(true)
    })

    it('reviewer 应有编辑权限', () => {
      expect(ROLE_FILE_PERMISSIONS.reviewer.edit).toBe(true)
    })

    it('reviewer 不应有删除权限', () => {
      expect(ROLE_FILE_PERMISSIONS.reviewer.delete).toBe(false)
    })

    it('reviewer 不应有配置权限', () => {
      expect(ROLE_FILE_PERMISSIONS.reviewer.configPermission).toBe(false)
    })

    it('column_admin 应有上传权限', () => {
      expect(ROLE_FILE_PERMISSIONS.column_admin.upload).toBe(true)
    })

    it('column_admin 应有编辑权限', () => {
      expect(ROLE_FILE_PERMISSIONS.column_admin.edit).toBe(true)
    })

    it('column_admin 应有删除权限', () => {
      expect(ROLE_FILE_PERMISSIONS.column_admin.delete).toBe(true)
    })

    it('column_admin 应有配置权限', () => {
      expect(ROLE_FILE_PERMISSIONS.column_admin.configPermission).toBe(true)
    })

    it('column_admin 不应有物理删除权限', () => {
      expect(ROLE_FILE_PERMISSIONS.column_admin.physicalDelete).toBe(false)
    })

    it('system_admin 应有全部权限', () => {
      expect(ROLE_FILE_PERMISSIONS.system_admin.upload).toBe(true)
      expect(ROLE_FILE_PERMISSIONS.system_admin.edit).toBe(true)
      expect(ROLE_FILE_PERMISSIONS.system_admin.delete).toBe(true)
      expect(ROLE_FILE_PERMISSIONS.system_admin.physicalDelete).toBe(true)
      expect(ROLE_FILE_PERMISSIONS.system_admin.configPermission).toBe(true)
      expect(ROLE_FILE_PERMISSIONS.system_admin.viewStats).toBe(true)
    })

    it('所有角色应包含全部权限字段', () => {
      const keys = ['upload', 'edit', 'delete', 'physicalDelete', 'configPermission', 'viewStats']
      for (const role of Object.values(ROLE_FILE_PERMISSIONS)) {
        expect(Object.keys(role).sort()).toEqual(keys.sort())
        for (const key of keys) {
          expect(typeof role[key]).toBe('boolean')
        }
      }
    })
  })

  // ==================== 边界场景 ====================
  describe('边界场景', () => {
    it('EXECUTABLE_BLACKLIST 不应与 PREVIEWABLE_FORMATS 有重叠', () => {
      const blSet = new Set(EXECUTABLE_BLACKLIST.map((e) => e.replace('.', '')))
      const overlap = PREVIEWABLE_FORMATS.filter((ext) => blSet.has(ext))
      expect(overlap).toEqual([])
    })

    it('DOCUMENT_FORMATS 和 IMAGE_FORMATS 不应有重叠', () => {
      const overlap = DOCUMENT_FORMATS.filter((ext) => IMAGE_FORMATS.includes(ext))
      expect(overlap).toEqual([])
    })

    it('所有常量值应为不可变的原始类型', () => {
      expect(typeof DEFAULT_MAX_FILE_SIZE).toBe('number')
      expect(typeof DEFAULT_DAILY_DOWNLOAD_LIMIT).toBe('number')
      expect(typeof DEFAULT_ANONYMOUS_RATE_LIMIT).toBe('number')
      expect(typeof AUTO_ARCHIVE_DAYS).toBe('number')
      expect(typeof PREVIEW_CACHE_PATH).toBe('string')
      expect(typeof FILE_STORAGE_PATH).toBe('string')
    })
  })
})