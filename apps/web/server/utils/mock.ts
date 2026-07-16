/**
 * 本地开发 Mock 数据（Cloudflare D1 的替代）
 * 生产环境部署到 Cloudflare 后，所有查询走 D1，不会使用此文件。
 */

// 栏目数据
export const MOCK_COLUMNS = [
  { id: 1, parent_id: 0, name: '机构概况', code: 'about', sort_order: 1, icon: 'OfficeBuilding' },
  { id: 2, parent_id: 0, name: '教务通知', code: 'notice', sort_order: 2, icon: 'Bell' },
  { id: 3, parent_id: 0, name: '教学动态', code: 'news', sort_order: 3, icon: 'Document' },
  { id: 4, parent_id: 0, name: '办事指南', code: 'guide', sort_order: 4, icon: 'Guide' },
  { id: 5, parent_id: 0, name: '下载中心', code: 'download', sort_order: 5, icon: 'Download' },
  { id: 6, parent_id: 0, name: '课表查询', code: 'schedule', sort_order: 6, icon: 'Calendar' },
  { id: 11, parent_id: 1, name: '部门简介', code: 'about-intro', sort_order: 1, icon: null },
  { id: 12, parent_id: 1, name: '现任领导', code: 'about-leaders', sort_order: 2, icon: null },
  { id: 13, parent_id: 1, name: '机构设置', code: 'about-structure', sort_order: 3, icon: null },
  { id: 21, parent_id: 2, name: '教务通知', code: 'notice-general', sort_order: 1, icon: null },
  { id: 22, parent_id: 2, name: '考试公告', code: 'notice-exam', sort_order: 2, icon: null },
  { id: 23, parent_id: 2, name: '选课通知', code: 'notice-course', sort_order: 3, icon: null },
  { id: 31, parent_id: 3, name: '教学新闻', code: 'news-teaching', sort_order: 1, icon: null },
  { id: 32, parent_id: 3, name: '教学研究', code: 'news-research', sort_order: 2, icon: null },
  { id: 41, parent_id: 4, name: '办事流程', code: 'guide-process', sort_order: 1, icon: null },
  { id: 42, parent_id: 4, name: '常见问题', code: 'guide-faq', sort_order: 2, icon: null },
]

// 文章数据
export const MOCK_ARTICLES = [
  {
    id: 1,
    column_id: 21,
    title: '关于2026年春季学期开学时间调整的通知',
    content:
      '<p>各位同学:</p><p>根据学校整体工作安排,2026年春季学期开学时间调整为2月17日(周一),请相互转告。</p><p>特此通知。</p><p>教务处</p><p>2026年1月15日</p>',
    publish_date: '2026-01-15 09:00:00',
    views: 1280,
    is_top: 1,
    column_name: '教务通知',
  },
  {
    id: 2,
    column_id: 21,
    title: '关于2026年上半年全国大学英语四六级考试报名的通知',
    content:
      '<p>各学院、各班级:</p><p>2026年上半年全国大学英语四六级考试报名工作即将开始,具体安排如下...</p>',
    publish_date: '2026-01-10 14:30:00',
    views: 856,
    is_top: 1,
    column_name: '教务通知',
  },
  {
    id: 3,
    column_id: 22,
    title: '2025-2026学年第一学期期末考试安排公告',
    content:
      '<p>2025-2026学年第一学期期末考试将于2026年1月8日至1月16日进行,请同学们合理安排复习时间。</p>',
    publish_date: '2025-12-20 10:00:00',
    views: 3420,
    is_top: 0,
    column_name: '考试公告',
  },
  {
    id: 4,
    column_id: 23,
    title: '关于2026年春季学期公共课选课的通知',
    content: '<p>2026年春季学期公共课选课系统将于1月20日开放,请同学们按时选课。</p>',
    publish_date: '2026-01-05 16:00:00',
    views: 2156,
    is_top: 0,
    column_name: '选课通知',
  },
  {
    id: 5,
    column_id: 31,
    title: '我校学子在2025年全国大学生数学建模竞赛中获佳绩',
    content:
      '<p>近日,2025年全国大学生数学建模竞赛成绩揭晓,我校参赛队伍获得全国一等奖2项、二等奖5项,成绩喜人。</p>',
    publish_date: '2025-12-15 09:00:00',
    views: 567,
    is_top: 0,
    column_name: '教学新闻',
  },
  {
    id: 6,
    column_id: 32,
    title: '计算机学院举办人工智能前沿技术讲座',
    content: '<p>2025年12月10日,计算机学院邀请清华大学张教授来校开展人工智能前沿技术专题讲座。</p>',
    publish_date: '2025-12-10 14:00:00',
    views: 432,
    is_top: 0,
    column_name: '教学研究',
  },
  {
    id: 7,
    column_id: 41,
    title: '本科毕业设计(论文)工作流程指南',
    content:
      '<p>一、选题阶段(第7学期第10周前完成)</p><p>二、开题阶段(第7学期第15周前完成)</p><p>三、中期检查(第8学期第8周前完成)...</p>',
    publish_date: '2025-09-01 09:00:00',
    views: 1890,
    is_top: 0,
    column_name: '办事流程',
  },
  {
    id: 8,
    column_id: 42,
    title: '学生证补办流程',
    content:
      '<p>1. 到所在学院开具学生证遗失证明</p><p>2. 携带身份证到教务处学籍科</p><p>3. 填写学生证补办申请表</p><p>4. 缴纳工本费10元</p><p>5. 5个工作日后领取</p>',
    publish_date: '2025-08-15 10:00:00',
    views: 987,
    is_top: 0,
    column_name: '常见问题',
  },
]

// 部门领导数据
export const MOCK_DEPT_LEADERS = [
  {
    id: 1,
    name: '张明华',
    position: '教务处处长',
    photo: null,
    intro: '教授,博士生导师,主要研究方向为高等教育管理。',
    sort_order: 1,
  },
  {
    id: 2,
    name: '李红梅',
    position: '教务处副处长',
    photo: null,
    intro: '副教授,长期从事教学管理工作。',
    sort_order: 2,
  },
  {
    id: 3,
    name: '王建国',
    position: '教务处副处长',
    photo: null,
    intro: '研究员,主持多项省级教学改革项目。',
    sort_order: 3,
  },
]

// 课程表数据
export const MOCK_CLASS_SCHEDULE = [
  {
    week_number: 1,
    day_of_week: 1,
    period: 1,
    course_name: '高等数学',
    teacher: '陈教授',
    classroom: 'A101',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 1,
    period: 2,
    course_name: '大学英语',
    teacher: '李老师',
    classroom: 'A203',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 2,
    period: 1,
    course_name: '数据结构',
    teacher: '王教授',
    classroom: 'B305',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 2,
    period: 2,
    course_name: '计算机网络',
    teacher: '张老师',
    classroom: 'B402',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 3,
    period: 1,
    course_name: '操作系统',
    teacher: '刘教授',
    classroom: 'A201',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 4,
    period: 1,
    course_name: '数据库原理',
    teacher: '赵老师',
    classroom: 'C101',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 4,
    period: 2,
    course_name: '软件工程',
    teacher: '孙教授',
    classroom: 'C203',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 5,
    period: 1,
    course_name: '人工智能导论',
    teacher: '周教授',
    classroom: 'B501',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 5,
    period: 2,
    course_name: '体育',
    teacher: '吴老师',
    classroom: '操场',
    class_name: '软件2301',
  },
  {
    week_number: 1,
    day_of_week: 1,
    period: 1,
    course_name: '线性代数',
    teacher: '陈教授',
    classroom: 'A102',
    class_name: '计科2301',
  },
]

// 检查是否为本地开发（DB 是否不可用）
export function isLocalDev(event: any) {
  return !event.context.cloudflare?.env?.DB
}
