<template>
  <!-- CMS 富文本编辑器: contenteditable + 完整工具栏 + 安全管控 -->
  <div class="rich-editor" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- ===== 工具栏 ===== -->
    <div v-show="!sourceMode" class="editor-toolbar">
      <!-- 操作组: 撤销/重做 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="撤销 (Ctrl+Z)" @click.prevent="exec('undo')"><Icon icon="mdi:undo" :width="16" :height="16" /></button>
        <button class="tb-btn" title="重做 (Ctrl+Y)" @click.prevent="exec('redo')"><Icon icon="mdi:redo" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 文字样式 -->
      <div class="toolbar-group">
        <button class="tb-btn" :class="{ active: isBold }" title="加粗 (Ctrl+B)" @click.prevent="exec('bold')"><Icon icon="mdi:format-bold" :width="16" :height="16" /></button>
        <button class="tb-btn" :class="{ active: isItalic }" title="斜体 (Ctrl+I)" @click.prevent="exec('italic')"><Icon icon="mdi:format-italic" :width="16" :height="16" /></button>
        <button class="tb-btn" :class="{ active: isUnderline }" title="下划线 (Ctrl+U)" @click.prevent="exec('underline')"><Icon icon="mdi:format-underline" :width="16" :height="16" /></button>
        <button class="tb-btn" :class="{ active: isStrike }" title="删除线" @click.prevent="exec('strikeThrough')"><Icon icon="mdi:format-strikethrough" :width="16" :height="16" /></button>
        <button class="tb-btn" title="上标" @click.prevent="exec('superscript')"><Icon icon="mdi:format-superscript" :width="16" :height="16" /></button>
        <button class="tb-btn" title="下标" @click.prevent="exec('subscript')"><Icon icon="mdi:format-subscript" :width="16" :height="16" /></button>
        <button class="tb-btn" title="清除格式" @click.prevent="exec('removeFormat')"><Icon icon="mdi:format-clear" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 标题层级: 仅 H1-H3 -->
      <div class="toolbar-group">
        <select class="tb-select" :value="currentHeading" @change="setHeading(($event.target as HTMLSelectElement).value)">
          <option value="p">正文</option>
          <option value="h1">一级标题 H1</option>
          <option value="h2">二级标题 H2</option>
          <option value="h3">三级标题 H3</option>
        </select>
      </div>

      <div class="toolbar-sep" />

      <!-- 段落排版 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="左对齐" @click.prevent="exec('justifyLeft')"><Icon icon="mdi:format-align-left" :width="16" :height="16" /></button>
        <button class="tb-btn" title="居中" @click.prevent="exec('justifyCenter')"><Icon icon="mdi:format-align-center" :width="16" :height="16" /></button>
        <button class="tb-btn" title="右对齐" @click.prevent="exec('justifyRight')"><Icon icon="mdi:format-align-right" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 列表/缩进 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="有序列表" @click.prevent="exec('insertOrderedList')"><Icon icon="mdi:format-list-numbered" :width="16" :height="16" /></button>
        <button class="tb-btn" title="无序列表" @click.prevent="exec('insertUnorderedList')"><Icon icon="mdi:format-list-bulleted" :width="16" :height="16" /></button>
        <button class="tb-btn" title="减少缩进" @click.prevent="exec('outdent')"><Icon icon="mdi:format-indent-decrease" :width="16" :height="16" /></button>
        <button class="tb-btn" title="增加缩进" @click.prevent="exec('indent')"><Icon icon="mdi:format-indent-increase" :width="16" :height="16" /></button>
        <button class="tb-btn" title="首行缩进2em" @click.prevent="applyFirstLineIndent"><Icon icon="mdi:format-text" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 链接 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="插入链接" @click.prevent="showLinkDialog = true"><Icon icon="mdi:link" :width="16" :height="16" /></button>
        <button class="tb-btn" title="删除链接" @click.prevent="exec('unlink')"><Icon icon="mdi:link-off" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 表格 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="插入表格" @click.prevent="showTableDialog = true"><Icon icon="mdi:table" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 插入 -->
      <div class="toolbar-group">
        <button class="tb-btn" title="插入图片" @click.prevent="$emit('openMedia', 'image')"><Icon icon="mdi:image-plus" :width="16" :height="16" /></button>
        <button class="tb-btn" title="插入附件" @click.prevent="$emit('openMedia', 'attachment')"><Icon icon="mdi:paperclip" :width="16" :height="16" /></button>
        <button class="tb-btn" title="插入公式 (LaTeX)" @click.prevent="showFormulaDialog = true"><Icon icon="mdi:function-variant" :width="16" :height="16" /></button>
        <button class="tb-btn" title="特殊字符" @click.prevent="showCharDialog = true"><Icon icon="mdi:omega" :width="16" :height="16" /></button>
        <button class="tb-btn" title="水平线" @click.prevent="exec('insertHorizontalRule')"><Icon icon="mdi:minus" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-sep" />

      <!-- 查找替换 -->
      <div class="toolbar-group">
        <button class="tb-btn" :class="{ active: showFindBar }" title="查找替换" @click.prevent="showFindBar = !showFindBar"><Icon icon="mdi:magnify" :width="16" :height="16" /></button>
      </div>

      <div class="toolbar-spacer" />

      <!-- 右侧: 模式切换 -->
      <div class="toolbar-group toolbar-right">
        <button v-if="canSourceCode" class="tb-btn" :class="{ active: sourceMode }" title="HTML源码 (仅终审/超管)" @click.prevent="toggleSourceMode"><Icon icon="mdi:code-tags" :width="16" :height="16" /></button>
        <button class="tb-btn" title="预览" @click.prevent="$emit('preview')"><Icon icon="mdi:eye" :width="16" :height="16" /></button>
        <button class="tb-btn" :class="{ active: isFullscreen }" title="全屏编辑" @click.prevent="toggleFullscreen"><Icon icon="mdi:fullscreen" :width="16" :height="16" /></button>
        <button class="tb-btn save-btn" title="保存草稿 (Ctrl+S)" @click.prevent="$emit('saveDraft')"><Icon icon="mdi:content-save" :width="16" :height="16" /></button>
      </div>
    </div>

    <!-- ===== 查找替换栏 ===== -->
    <div v-if="showFindBar" class="find-bar">
      <input v-model="findText" class="find-input" placeholder="查找内容..." @keyup.enter="doFind" />
      <input v-model="replaceText" class="find-input" placeholder="替换为..." />
      <button class="tb-btn" @click="doFind" title="查找下一个">查找</button>
      <button class="tb-btn" @click="doReplace" title="替换">替换</button>
      <button class="tb-btn" @click="doReplaceAll" title="全部替换">全部</button>
      <el-checkbox v-model="findCaseSensitive" size="small">区分大小写</el-checkbox>
    </div>

    <!-- ===== 源码模式 ===== -->
    <div v-if="sourceMode" class="source-editor">
      <div class="source-warning">
        <Icon icon="mdi:alert" :width="16" :height="16" />
        HTML源码模式仅限终审员/超级管理员使用，禁止插入 script/iframe 等危险标签
      </div>
      <textarea v-model="sourceCode" class="source-textarea" spellcheck="false" />
    </div>

    <!-- ===== 富文本编辑区 ===== -->
    <div
      v-show="!sourceMode"
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      spellcheck="false"
      @input="onContentChange"
      @paste="onPaste"
      @keydown="onKeyDown"
      @mouseup="updateToolbarState"
      @keyup="updateToolbarState"
      v-html="modelValue"
    />

    <!-- ===== 自动保存状态 ===== -->
    <div class="editor-status-bar">
      <span class="auto-save-status">
        <Icon v-if="autoSaving" icon="mdi:loading" :width="12" :height="12" class="spin" />
        <Icon v-else icon="mdi:check-circle" :width="12" :height="12" />
        {{ autoSaveStatus }}
      </span>
      <span class="char-count">{{ charCount }} 字</span>
    </div>

    <!-- ===== 链接对话框 ===== -->
    <el-dialog v-model="showLinkDialog" title="插入链接" width="500px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="链接文字">
          <el-input v-model="linkForm.text" placeholder="请填写真实名称，禁止'点击这里'" />
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="linkForm.url" placeholder="https://... 或 mailto:..." />
        </el-form-item>
        <el-form-item label="打开方式">
          <el-switch v-model="linkForm.newWindow" active-text="新窗口打开" inactive-text="当前窗口" />
        </el-form-item>
        <div v-if="linkError" class="link-error">
          <Icon icon="mdi:close-circle" :width="14" :height="14" />
          {{ linkError }}
        </div>
        <div v-if="linkWarning" class="link-warning">
          <Icon icon="mdi:alert" :width="14" :height="14" />
          {{ linkWarning }}
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!!linkError" @click="insertLink">确认插入</el-button>
      </template>
    </el-dialog>

    <!-- ===== 表格对话框 ===== -->
    <el-dialog v-model="showTableDialog" title="插入表格" width="360px" append-to-body>
      <el-form label-width="60px" inline>
        <el-form-item label="行数">
          <el-input-number v-model="tableForm.rows" :min="1" :max="30" />
        </el-form-item>
        <el-form-item label="列数">
          <el-input-number v-model="tableForm.cols" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="边框">
          <el-switch v-model="tableForm.border" active-text="显示" inactive-text="隐藏" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTableDialog = false">取消</el-button>
        <el-button type="primary" @click="insertTable">插入表格</el-button>
      </template>
    </el-dialog>

    <!-- ===== 公式对话框 ===== -->
    <el-dialog v-model="showFormulaDialog" title="插入数学公式 (LaTeX)" width="520px" append-to-body>
      <el-form>
        <el-form-item label="LaTeX 公式">
          <el-input v-model="formulaText" type="textarea" :rows="3" placeholder="如: E = mc^2 或 \frac{a}{b}" />
        </el-form-item>
        <div v-if="formulaText" class="formula-preview">
          <div class="preview-label">预览:</div>
          <div class="preview-content">{{ formulaText }}</div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showFormulaDialog = false">取消</el-button>
        <el-button type="primary" @click="insertFormula">插入公式</el-button>
      </template>
    </el-dialog>

    <!-- ===== 特殊字符对话框 ===== -->
    <el-dialog v-model="showCharDialog" title="特殊字符" width="460px" append-to-body>
      <div class="char-grid">
        <button
          v-for="char in specialChars"
          :key="char"
          class="char-btn"
          @click="insertSpecialChar(char)"
        >{{ char }}</button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// CMS 富文本编辑器: contenteditable + execCommand + 安全管控
import { EditorDisabledFeatures, AutoDraftConfig } from '~/utils/types'

const props = defineProps<{
  modelValue: string
  /** 是否允许源码模式(仅终审/超管) */
  canSourceCode?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'openMedia': [type: 'image' | 'attachment']
  'saveDraft': []
  'preview': []
  'contentChange': [html: string]
}>()

// ===== Refs =====
const editorRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const sourceMode = ref(false)
const sourceCode = ref('')
const showFindBar = ref(false)
const findText = ref('')
const replaceText = ref('')
const findCaseSensitive = ref(false)

// 工具栏状态
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isStrike = ref(false)
const currentHeading = ref('p')

// 自动保存
const autoSaving = ref(false)
const autoSaveStatus = ref('已保存')
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

// 字数统计
const charCount = computed(() => {
  if (!editorRef.value) return 0
  return (editorRef.value.textContent || '').replace(/\s/g, '').length
})

// ===== 执行命令 =====
const exec = (command: string, value?: string) => {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
  updateToolbarState()
  onContentChange()
}

// ===== 标题层级(仅 H1-H3) =====
const setHeading = (tag: string) => {
  if (tag === 'p') {
    exec('formatBlock', '<p>')
  } else if (['h1', 'h2', 'h3'].includes(tag)) {
    exec('formatBlock', `<${tag}>`)
  }
  // H4-H6 不提供, 系统强制限制
}

// ===== 首行缩进 =====
const applyFirstLineIndent = () => {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const block = sel.getRangeAt(0).startContainer.parentElement?.closest('p, div, h1, h2, h3')
  if (block) {
    (block as HTMLElement).style.textIndent = '2em'
    onContentChange()
  }
}

// ===== 链接对话框 =====
const showLinkDialog = ref(false)
const linkForm = ref({ text: '', url: '', newWindow: true })
const linkError = ref('')
const linkWarning = ref('')

watch(() => showLinkDialog.value, (val) => {
  if (val) {
    // 预选文字
    const sel = window.getSelection()
    linkForm.value.text = sel?.toString() || ''
    linkForm.value.url = ''
    linkForm.value.newWindow = true
    linkError.value = ''
    linkWarning.value = ''
  }
})

watch(() => linkForm.value.url, (url) => {
  linkError.value = ''
  linkWarning.value = ''
  if (!url) return

  // 检测禁止的域名
  for (const pattern of EditorDisabledFeatures.bannedDomainPatterns) {
    if (pattern.test(url)) {
      linkError.value = '检测到商业/自媒体域名，不允许插入此类外链'
      return
    }
  }

  // 检测是否为外链
  const isAllowed = EditorDisabledFeatures.allowedDomains.some(p => p.test(url))
  if (url.startsWith('http') && !isAllowed) {
    linkWarning.value = '检测到非官方域名外链，请确认链接合规'
  }

  // 检测模糊链接文字
  const vaguePatterns = ['点击这里', '查看详情', '点击此处', '点这里']
  if (vaguePatterns.some(p => linkForm.value.text.includes(p))) {
    linkError.value = '链接文字禁止使用"点击这里"等模糊描述，请填写真实名称'
  }
})

const insertLink = () => {
  if (linkError.value) return
  const { text, url, newWindow } = linkForm.value
  if (!url) return

  // 校内链接自动补全域名
  let finalUrl = url
  if (url.startsWith('/') && !url.startsWith('//')) {
    finalUrl = `https://jwc.sziit.edu.cn${url}`
  }

  const target = newWindow ? ' target="_blank" rel="noopener"' : ''
  const style = ' style="color:#3B82C4"'
  const html = `<a href="${finalUrl}"${target}${style}>${text || finalUrl}</a>`

  // 插入到光标位置
  const sel = window.getSelection()
  if (sel?.rangeCount) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const temp = document.createElement('span')
    temp.innerHTML = html
    const node = temp.firstChild
    if (node) range.insertNode(node)
  }

  showLinkDialog.value = false
  onContentChange()
}

// ===== 表格对话框 =====
const showTableDialog = ref(false)
const tableForm = ref({ rows: 3, cols: 3, border: true })

const insertTable = () => {
  const { rows, cols, border } = tableForm.value
  const borderStyle = border
    ? 'border:1px solid #A0C4E8;'
    : 'border:1px solid #EAF4FD;'
  let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;">'
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      const tag = r === 0 ? 'th' : 'td'
      const bg = r === 0 ? 'background:#F0F7FF;font-weight:600;' : ''
      html += `<${tag} style="${borderStyle}padding:8px 12px;${bg}">&nbsp;</${tag}>`
    }
    html += '</tr>'
  }
  html += '</table><p>&nbsp;</p>'

  exec('insertHTML', html)
  showTableDialog.value = false
}

// ===== 公式对话框 =====
const showFormulaDialog = ref(false)
const formulaText = ref('')

const insertFormula = () => {
  if (!formulaText.value.trim()) return
  // Mock: 插入为代码块形式的公式展示(实际应集成 MathJax/KaTeX)
  const html = `<span class="math-formula" data-latex="${formulaText.value}" style="font-family:'JetBrains Mono',monospace;background:#f0f6fc;padding:2px 8px;border-radius:4px;display:inline-block;font-size:14px;color:#1A365D;">${formulaText.value}</span>&nbsp;`
  exec('insertHTML', html)
  showFormulaDialog.value = false
  formulaText.value = ''
}

// ===== 特殊字符 =====
const showCharDialog = ref(false)
const specialChars = [
  '—', '…', '、', '。', '，', '；', '：', '？', '！', '（', '）', '《', '》',
  '【', '】', '「', '」', '『', '』', '〈', '〉', '±', '×', '÷', '≈', '≠',
  '≤', '≥', '∞', '∑', '∏', '√', '∫', '℃', '°', '′', '″', '©', '®', '™',
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '㎡', '㎥', '㎞',
  '年', '月', '日',
]

const insertSpecialChar = (char: string) => {
  exec('insertText', char)
  showCharDialog.value = false
}

// ===== 源码模式 =====
const toggleSourceMode = () => {
  if (!props.canSourceCode) {
    ElMessage.warning('HTML源码模式仅限终审员/超级管理员使用')
    return
  }
  if (sourceMode.value) {
    // 切回富文本: 从源码同步
    if (editorRef.value) {
      editorRef.value.innerHTML = sourceCode.value
    }
    emit('update:modelValue', sourceCode.value)
    sourceMode.value = false
  } else {
    sourceCode.value = editorRef.value?.innerHTML || ''
    sourceMode.value = true
  }
}

// ===== 全屏 =====
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// ===== 查找替换 =====
const doFind = () => {
  if (!findText.value || !editorRef.value) return
  const content = editorRef.value.innerHTML
  const flags = findCaseSensitive.value ? 'g' : 'gi'
  const regex = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
  const match = regex.exec(content)
  if (match) {
    // 使用 window.find 或手动选区
    try { window.find(findText.value, findCaseSensitive.value) } catch {}
  } else {
    ElMessage.info('未找到匹配内容')
  }
}

const doReplace = () => {
  const sel = window.getSelection()
  if (sel?.toString() === findText.value) {
    exec('insertText', replaceText.value)
  } else {
    doFind()
  }
}

const doReplaceAll = () => {
  if (!findText.value || !editorRef.value) return
  const flags = findCaseSensitive.value ? 'g' : 'gi'
  const regex = new RegExp(findText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
  const newContent = editorRef.value.innerHTML.replace(regex, replaceText.value)
  editorRef.value.innerHTML = newContent
  onContentChange()
  ElMessage.success('替换完成')
}

// ===== 粘贴过滤(纯文本粘贴,过滤Word冗余样式) =====
const onPaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const html = e.clipboardData?.getData('text/html')
  const text = e.clipboardData?.getData('text/plain') || ''

  if (html) {
    // 过滤危险标签和 Word 冗余
    let cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '') // Word 特殊标签
      .replace(/mso-[\w-]+\s*:\s*[^;"]+;?/gi, '') // Word 内联样式
      .replace(/class="Mso\w*"/gi, '') // Word 类名
      .replace(/<meta[\s\S]*?>/gi, '')
      .replace(/<link[\s\S]*?>/gi, '')
    document.execCommand('insertHTML', false, cleaned)
  } else {
    document.execCommand('insertText', false, text)
  }
  onContentChange()
}

// ===== 键盘快捷键 =====
const onKeyDown = (e: KeyboardEvent) => {
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    emit('saveDraft')
  }
  // Tab 缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    exec(e.shiftKey ? 'outdent' : 'indent')
  }
}

// ===== 内容变化 =====
const onContentChange = () => {
  const html = editorRef.value?.innerHTML || ''
  emit('update:modelValue', html)
  emit('contentChange', html)
  scheduleAutoSave()
}

// ===== 工具栏状态更新 =====
const updateToolbarState = () => {
  try {
    isBold.value = document.queryCommandState('bold')
    isItalic.value = document.queryCommandState('italic')
    isUnderline.value = document.queryCommandState('underline')
    isStrike.value = document.queryCommandState('strikeThrough')

    const block = document.queryCommandValue('formatBlock')?.toLowerCase() || 'p'
    currentHeading.value = ['h1', 'h2', 'h3'].includes(block) ? block : 'p'
  } catch {}
}

// ===== 自动保存 =====
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const scheduleAutoSave = () => {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  saveDebounceTimer = setTimeout(() => {
    autoSaving.value = true
    autoSaveStatus.value = '保存中...'
    // 触发父组件保存
    emit('saveDraft')
    setTimeout(() => {
      autoSaving.value = false
      autoSaveStatus.value = `自动保存于 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    }, 300)
  }, AutoDraftConfig.intervalSeconds * 1000)
}

// 启动定时自动保存
onMounted(() => {
  autoSaveStatus.value = '编辑中...'
})

onUnmounted(() => {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer)
  if (autoSaveTimer) clearInterval(autoSaveTimer)
  if (isFullscreen.value) document.body.style.overflow = ''
})

// ===== 外部方法: 插入图片(供媒体库回调) =====
const insertImage = (url: string, alt: string) => {
  const html = `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:4px;margin:8px 0;" />&nbsp;`
  exec('insertHTML', html)
}

const insertAttachmentLink = (url: string, filename: string, size: number, mimeType: string) => {
  const sizeStr = size > 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(1)}MB`
    : `${(size / 1024).toFixed(0)}KB`
  const ext = filename.split('.').pop()?.toUpperCase() || 'FILE'
  const html = `<div class="attachment-link" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:#f0f6fc;border:1px solid #D6E8FF;border-radius:6px;margin:8px 0;cursor:pointer;">
    <span style="font-size:20px;">📎</span>
    <div style="flex:1;">
      <a href="${url}" download="${filename}" style="color:#3B82C4;font-size:14px;text-decoration:none;">${filename}</a>
      <div style="font-size:12px;color:#999;">${ext} · ${sizeStr}</div>
    </div>
  </div>`
  exec('insertHTML', html)
}

defineExpose({ insertImage, insertAttachmentLink })
</script>

<style lang="scss" scoped>
.rich-editor {
  border: 1px solid $border-light;
  border-radius: $radius-md;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    border-radius: 0;
    border: none;
  }
}

// ===== 工具栏 =====
.editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  background: $bg-soft;
  border-bottom: 1px solid $border-lighter;
  min-height: 40px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
}

.toolbar-sep {
  width: 1px;
  height: 20px;
  background: $border-light;
  margin: 0 4px;
  flex-shrink: 0;
}

.toolbar-spacer {
  flex: 1;
}

.toolbar-right {
  margin-left: auto;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: rgba(74, 144, 217, 0.1);
    color: $primary;
  }

  &.active {
    background: $primary;
    color: #fff;
  }

  &.save-btn {
    color: $primary;
    &:hover { background: $primary; color: #fff; }
  }
}

.tb-select {
  height: 30px;
  padding: 0 6px;
  border: 1px solid $border-light;
  border-radius: $radius-sm;
  background: #fff;
  font-size: 12px;
  color: $text-regular;
  cursor: pointer;
  outline: none;

  &:focus { border-color: $primary; }
}

// ===== 查找栏 =====
.find-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbe6;
  border-bottom: 1px solid #fff1b8;
}

.find-input {
  height: 28px;
  padding: 0 8px;
  border: 1px solid $border-light;
  border-radius: $radius-sm;
  font-size: 13px;
  width: 160px;
  outline: none;

  &:focus { border-color: $primary; }
}

// ===== 源码模式 =====
.source-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.source-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fff2f0;
  border-bottom: 1px solid #ffccc7;
  font-size: 12px;
  color: $danger;

  :deep(svg) { flex-shrink: 0; }
}

.source-textarea {
  flex: 1;
  min-height: 300px;
  padding: 12px;
  border: none;
  font-family: $font-mono;
  font-size: 13px;
  line-height: 1.6;
  color: $text-regular;
  resize: vertical;
  outline: none;
}

// ===== 编辑区 =====
.editor-content {
  flex: 1;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
  line-height: 1.8;
  font-size: 15px;
  color: $text-regular;
  outline: none;

  :deep(p) { margin-bottom: 12px; }
  :deep(h1) { font-size: 22px; font-weight: $fw-bold; color: $text-primary; margin: 16px 0 12px; }
  :deep(h2) { font-size: 18px; font-weight: $fw-bold; color: $text-primary; margin: 14px 0 10px; }
  :deep(h3) { font-size: 16px; font-weight: $fw-semibold; color: $text-primary; margin: 12px 0 8px; }
  :deep(img) { max-width: 100%; height: auto; border-radius: $radius-base; }
  :deep(a) { color: #3B82C4; text-decoration: none; &:hover { text-decoration: underline; } }
  :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; }
  :deep(blockquote) { border-left: 3px solid $primary; padding-left: 12px; color: $text-secondary; margin: 12px 0; }
  :deep(hr) { border: none; border-top: 1px solid $border-light; margin: 16px 0; }
  :deep(ul), :deep(ol) { padding-left: 24px; margin-bottom: 12px; }

  &:focus {
    box-shadow: inset 0 0 0 2px rgba(74, 144, 217, 0.15);
  }
}

// ===== 状态栏 =====
.editor-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: $bg-soft;
  border-top: 1px solid $border-lighter;
  font-size: 11px;
  color: $text-placeholder;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ===== 对话框内部样式 =====
.link-error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $danger;
  margin-top: 8px;
  :deep(svg) { flex-shrink: 0; }
}

.link-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $warning;
  margin-top: 8px;
  :deep(svg) { flex-shrink: 0; }
}

.formula-preview {
  margin-top: 12px;
  .preview-label { font-size: 12px; color: $text-secondary; margin-bottom: 4px; }
  .preview-content {
    padding: 12px;
    background: $bg-soft;
    border-radius: $radius-base;
    font-family: $font-mono;
    font-size: 16px;
    color: $text-primary;
    text-align: center;
  }
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
}

.char-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-lighter;
  border-radius: $radius-sm;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $primary-bg;
    border-color: $primary;
    color: $primary;
  }
}
</style>
