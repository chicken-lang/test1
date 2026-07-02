// ====================================================================
// 图标字典 v3.0 - 教务处用户端
// 统一管理全站图标,避免散落硬编码
// 基于 @iconify-json/mdi (Material Design Icons)
// 用法: <Icon :icon="icons.home" />
// ====================================================================

// 导航类
export const navIcons = {
  home: 'mdi:home-outline',
  homeFill: 'mdi:home',
  news: 'mdi:newspaper-variant-outline',
  notice: 'mdi:bullhorn-outline',
  calendar: 'mdi:calendar-month-outline',
  about: 'mdi:information-outline',
  contact: 'mdi:map-marker-outline',
  search: 'mdi:magnify',
  menu: 'mdi:menu',
  close: 'mdi:close',
  chevronDown: 'mdi:chevron-down',
  chevronRight: 'mdi:chevron-right',
  chevronLeft: 'mdi:chevron-left',
  chevronUp: 'mdi:chevron-up',
  arrowRight: 'mdi:arrow-right',
  arrowLeft: 'mdi:arrow-left',
  expand: 'mdi:arrow-expand',
  sitemap: 'mdi:sitemap',
  compassOff: 'mdi:compass-off-outline',
  serverOff: 'mdi:server-network-off',
} as const

// 业务类(教务处常用入口)
export const bizIcons = {
  // 教学管理
  course: 'mdi:book-open-variant',
  schedule: 'mdi:calendar-clock-outline',
  exam: 'mdi:file-document-edit-outline',
  score: 'mdi:chart-bar',
  credit: 'mdi:counter',
  // 学籍事务
  enrollment: 'mdi:account-school-outline',
  student: 'mdi:account-outline',
  graduate: 'mdi:school',
  certificate: 'mdi:certificate-outline',
  // 办事服务
  form: 'mdi:file-sign',
  download: 'mdi:tray-arrow-down',
  upload: 'mdi:tray-arrow-up',
  guide: 'mdi:compass-outline',
  faq: 'mdi:help-circle-outline',
  // 信息查询
  classroom: 'mdi:google-classroom',
  teacher: 'mdi:account-tie-outline',
  report: 'mdi:file-chart-outline',
  // 办公
  document: 'mdi:file-document-outline',
  archive: 'mdi:archive-outline',
  internal: 'mdi:domain',
  // 文章元信息
  source: 'mdi:source-commit',
} as const

// 操作类
export const actionIcons = {
  // 通用操作
  search: 'mdi:magnify',
  filter: 'mdi:filter-variant',
  sort: 'mdi:sort-variant',
  refresh: 'mdi:refresh',
  edit: 'mdi:pencil-outline',
  delete: 'mdi:trash-can-outline',
  add: 'mdi:plus',
  remove: 'mdi:minus',
  check: 'mdi:check',
  checkCircle: 'mdi:check-circle-outline',
  close: 'mdi:close',
  closeCircle: 'mdi:close-circle-outline',
  // 互动
  share: 'mdi:share-variant-outline',
  star: 'mdi:star-outline',
  starFill: 'mdi:star',
  bookmark: 'mdi:bookmark-outline',
  thumbUp: 'mdi:thumb-up-outline',
  eye: 'mdi:eye-outline',
  // 文件
  download: 'mdi:tray-arrow-down',
  print: 'mdi:printer',
  copy: 'mdi:content-copy',
  link: 'mdi:link-variant',
  // 字号/编辑工具
  formatFont: 'mdi:format-font',
  bookmarkFill: 'mdi:bookmark',
  // 导航
  back: 'mdi:arrow-left',
  forward: 'mdi:arrow-right',
  top: 'mdi:arrow-up',
  // 时间
  clock: 'mdi:clock-outline',
  calendar: 'mdi:calendar-outline',
  history: 'mdi:history',
} as const

// 状态类
export const statusIcons = {
  info: 'mdi:information-outline',
  success: 'mdi:check-circle-outline',
  warning: 'mdi:alert-outline',
  danger: 'mdi:alert-circle-outline',
  error: 'mdi:close-circle-outline',
  loading: 'mdi:loading',
  empty: 'mdi:inbox-outline',
  notFound: 'mdi:file-search-outline',
  lock: 'mdi:lock-outline',
  unlock: 'mdi:lock-open-outline',
  new: 'mdi:new-box',
  hot: 'mdi:fire',
  top: 'mdi:arrow-up-bold',
} as const

// 用户类
export const userIcons = {
  user: 'mdi:account-outline',
  userFill: 'mdi:account',
  users: 'mdi:account-group-outline',
  login: 'mdi:login',
  logout: 'mdi:logout',
  register: 'mdi:account-plus-outline',
  profile: 'mdi:account-details-outline',
  settings: 'mdi:cog-outline',
  bell: 'mdi:bell-outline',
  email: 'mdi:email-outline',
  phone: 'mdi:phone-outline',
  location: 'mdi:map-marker-outline',
  idCard: 'mdi:card-account-details-outline',
} as const

// 媒体类
export const mediaIcons = {
  image: 'mdi:image-outline',
  video: 'mdi:video-outline',
  audio: 'mdi:volume-high',
  file: 'mdi:file-outline',
  paperclip: 'mdi:paperclip',
  pdf: 'mdi:file-pdf-box',
  word: 'mdi:file-word-box',
  excel: 'mdi:file-excel-box',
  ppt: 'mdi:file-powerpoint-box',
  zip: 'mdi:folder-zip-outline',
  wechat: 'mdi:wechat',
  weibo: 'mdi:sina-weibo',
  qq: 'mdi:qqchat',
} as const

// 装饰类
export const decoIcons = {
  shield: 'mdi:shield-school',
  book: 'mdi:book-open-page-variant-outline',
  pen: 'mdi:fountain-pen-tip',
  cap: 'mdi:school',
  trophy: 'mdi:trophy-outline',
  lightbulb: 'mdi:lightbulb-outline',
  target: 'mdi:bullseye-arrow',
  rocket: 'mdi:rocket-launch-outline',
  starFour: 'mdi:star-four-points-outline',
  quote: 'mdi:format-quote-open',
  lightningBolt: 'mdi:lightning-bolt',
} as const

// 汇总导出(扁平结构,供组件直接使用)
export const icons = {
  ...navIcons,
  ...bizIcons,
  ...actionIcons,
  ...statusIcons,
  ...userIcons,
  ...mediaIcons,
  ...decoIcons,
} as const

export type IconName = keyof typeof icons
