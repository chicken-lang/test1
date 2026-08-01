import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sha256 } from '../src/common/utils/hash.js'
import { ROLE_PERMISSIONS } from '../src/config/permissions.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. 创建角色权限模板
  const roleConfigs = [
    { role: 'editor', roleName: '编辑管理员', description: '仅文稿采编相关功能权限' },
    { role: 'reviewer', roleName: '审核管理员', description: '本栏目稿件初审权限和编辑权限' },
    { role: 'column_admin', roleName: '栏目管理员', description: '所辖板块终审、初审、栏目管理权限' },
    { role: 'system_admin', roleName: '系统管理员', description: '全部功能、全部栏目数据权限' },
  ]

  for (const config of roleConfigs) {
    const permissions = ROLE_PERMISSIONS[config.role] || []
    await prisma.rolePermission.upsert({
      where: { role: config.role },
      create: {
        role: config.role,
        roleName: config.roleName,
        description: config.description,
        permissions: JSON.stringify(permissions),
      },
      update: {
        permissions: JSON.stringify(permissions),
      },
    })
    console.log(`  ✓ Role permission: ${config.roleName}`)
  }

  // 2. 创建四个测试管理员账号 (密码都是 123456)
  // 密码流程: SHA-256(明文) → bcrypt 加盐 → 入库
  const passwordHash = await bcrypt.hash(sha256('123456'), 10)
  const admins = [
    {
      username: 'editor',
      nickname: '王编辑',
      role: 'editor',
      bindColumnIds: JSON.stringify([2, 3]),
      email: 'wang@sziit.edu.cn',
      unionId: 'U20260001',
    },
    {
      username: 'reviewer',
      nickname: '李审核',
      role: 'reviewer',
      bindColumnIds: JSON.stringify([1, 2, 3, 4]),
      email: 'li@sziit.edu.cn',
      unionId: 'U20260002',
    },
    {
      username: 'column_admin',
      nickname: '张栏目',
      role: 'column_admin',
      bindColumnIds: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]),
      email: 'zhang@sziit.edu.cn',
      unionId: 'U20260003',
    },
    {
      username: 'system_admin',
      nickname: '赵系统',
      role: 'system_admin',
      bindColumnIds: JSON.stringify([]),
      email: 'zhao@sziit.edu.cn',
      unionId: 'U20260004',
    },
  ]

  for (const admin of admins) {
    await prisma.admin.upsert({
      where: { username: admin.username },
      create: { ...admin, passwordHash },
      update: { passwordHash },
    })
    console.log(`  ✓ Admin: ${admin.nickname} (${admin.username} / 123456)`)
  }

  // 3. 创建栏目（6个一级栏目 + 22个二级栏目）
  // 对齐《教务处网站改版项目需求说明书》栏目结构
  //
  // 注意: 二级栏目通过 parentSlug 指定父栏目, 由下方逻辑在运行时解析为真实 id。
  //       严禁硬编码 parentId 数字 —— 一级栏目的自增 id 在不同环境/多次 seed 后
  //       并不稳定(历史上曾因此把二级栏目挂到已软删除的旧栏目上, 造成孤儿栏目、
  //       后台栏目树层级错乱)。
  const columns: Array<{
    columnName: string
    columnSlug: string
    parentSlug?: string
    sortOrder: number
    status: string
    description?: string
    responsibleBusiness?: string
    linkUrl?: string
  }> = [
    // === 一级栏目 ===
    { columnName: '部门概况', columnSlug: 'about', sortOrder: 1, status: 'ACTIVE', description: '部门简介、机构设置', responsibleBusiness: 'general' },
    { columnName: '通知公告', columnSlug: 'notices', sortOrder: 2, status: 'ACTIVE', description: '教师公告、学生公告、处务通知', responsibleBusiness: 'notice' },
    { columnName: '教务动态', columnSlug: 'news', sortOrder: 3, status: 'ACTIVE', description: '工作动态、会议活动', responsibleBusiness: 'news' },
    { columnName: '一流育人体系', columnSlug: 'first-class-education', sortOrder: 4, status: 'ACTIVE', description: '一流专业、一流课程、一流教师、一流教材、实训基地建设', responsibleBusiness: 'first-class' },
    { columnName: '人才培养平台', columnSlug: 'talent-platform', sortOrder: 5, status: 'ACTIVE', description: '本科教务系统、专科教务系统等外部平台链接', responsibleBusiness: 'platform' },
    { columnName: '办事指南', columnSlug: 'guide', sortOrder: 6, status: 'ACTIVE', description: '国家及省市文件、学校规章制度、下载中心', responsibleBusiness: 'guide' },
    // === 二级栏目：部门概况 ===
    { columnName: '部门简介', columnSlug: 'about-brief', parentSlug: 'about', responsibleBusiness: 'about-brief', sortOrder: 1, status: 'ACTIVE' },
    { columnName: '机构设置', columnSlug: 'about-structure', parentSlug: 'about', responsibleBusiness: 'about-structure', sortOrder: 2, status: 'ACTIVE' },
    // === 二级栏目：通知公告 ===
    { columnName: '教师公告', columnSlug: 'notice-teacher', parentSlug: 'notices', responsibleBusiness: 'notice-teacher', sortOrder: 1, status: 'ACTIVE' },
    { columnName: '学生公告', columnSlug: 'notice-student', parentSlug: 'notices', responsibleBusiness: 'notice-student', sortOrder: 2, status: 'ACTIVE' },
    { columnName: '处务通知', columnSlug: 'notice-office', parentSlug: 'notices', responsibleBusiness: 'notice-office', sortOrder: 3, status: 'ACTIVE' },
    // === 二级栏目：教务动态 ===
    { columnName: '工作动态', columnSlug: 'news-work', parentSlug: 'news', responsibleBusiness: 'news-work', sortOrder: 1, status: 'ACTIVE' },
    { columnName: '会议活动', columnSlug: 'news-meeting', parentSlug: 'news', responsibleBusiness: 'news-meeting', sortOrder: 2, status: 'ACTIVE' },
    // === 二级栏目：一流育人体系 ===
    { columnName: '一流专业', columnSlug: 'first-class-major', parentSlug: 'first-class-education', responsibleBusiness: 'first-class-major', sortOrder: 1, status: 'ACTIVE' },
    { columnName: '一流课程', columnSlug: 'first-class-course', parentSlug: 'first-class-education', responsibleBusiness: 'first-class-course', sortOrder: 2, status: 'ACTIVE' },
    { columnName: '一流教师', columnSlug: 'first-class-teacher', parentSlug: 'first-class-education', responsibleBusiness: 'first-class-teacher', sortOrder: 3, status: 'ACTIVE' },
    { columnName: '一流教材', columnSlug: 'first-class-textbook', parentSlug: 'first-class-education', responsibleBusiness: 'first-class-textbook', sortOrder: 4, status: 'ACTIVE' },
    { columnName: '实训基地建设', columnSlug: 'first-class-base', parentSlug: 'first-class-education', responsibleBusiness: 'first-class-base', sortOrder: 5, status: 'ACTIVE' },
    // === 二级栏目：人才培养平台 - 链接型 ===
    { columnName: '本科教务系统', columnSlug: 'platform-undergraduate', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 1, status: 'ACTIVE', linkUrl: 'https://jwxt.sziit.edu.cn/undergraduate' },
    { columnName: '专科教务系统', columnSlug: 'platform-college', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 2, status: 'ACTIVE', linkUrl: 'https://jwxt.sziit.edu.cn/college' },
    { columnName: '大赛与荣誉系统', columnSlug: 'platform-competition', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 3, status: 'ACTIVE', linkUrl: 'https://competition.sziit.edu.cn' },
    { columnName: '二级学院育人综合管理平台', columnSlug: 'platform-college-mgmt', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 4, status: 'ACTIVE', linkUrl: 'https://college-mgmt.sziit.edu.cn' },
    { columnName: '通用项目评审', columnSlug: 'platform-review', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 5, status: 'ACTIVE', linkUrl: 'https://review.sziit.edu.cn' },
    { columnName: '教学质量评价系统', columnSlug: 'platform-quality-eval', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 6, status: 'ACTIVE', linkUrl: 'https://quality.sziit.edu.cn' },
    { columnName: '实践教学平台', columnSlug: 'platform-practice', parentSlug: 'talent-platform', responsibleBusiness: 'platform-link', sortOrder: 7, status: 'ACTIVE', linkUrl: 'https://practice.sziit.edu.cn' },
    // === 二级栏目：办事指南 ===
    { columnName: '国家及省市文件', columnSlug: 'regulation-national', parentSlug: 'guide', responsibleBusiness: 'regulation-national', sortOrder: 1, status: 'ACTIVE' },
    { columnName: '学校规章制度', columnSlug: 'regulation-school', parentSlug: 'guide', responsibleBusiness: 'regulation-school', sortOrder: 2, status: 'ACTIVE' },
    { columnName: '下载中心', columnSlug: 'download', parentSlug: 'guide', responsibleBusiness: 'download', sortOrder: 3, status: 'ACTIVE' },
  ]

  // 先写入一级栏目, 再按 parentSlug 解析真实 id 写入二级栏目, 保证层级正确
  const rootSlugToId = new Map<string, number>()
  for (const col of columns.filter(c => !c.parentSlug)) {
    const { parentSlug: _ignored, ...data } = col
    const saved = await prisma.column.upsert({
      where: { columnSlug: col.columnSlug },
      create: { ...data, parentId: null },
      update: { ...data, parentId: null },
    })
    rootSlugToId.set(col.columnSlug, saved.id)
    console.log(`  ✓ Column: ${col.columnName} (id=${saved.id})`)
  }

  for (const col of columns.filter(c => c.parentSlug)) {
    const { parentSlug, ...data } = col
    const parentId = rootSlugToId.get(parentSlug!)
    if (!parentId) {
      console.warn(`  ! 跳过 ${col.columnName}: 父栏目 ${parentSlug} 不存在`)
      continue
    }
    await prisma.column.upsert({
      where: { columnSlug: col.columnSlug },
      create: { ...data, parentId },
      update: { ...data, parentId },
    })
    console.log(`  ✓ Column: ${col.columnName} (parent=${parentSlug}#${parentId})`)
  }

  // 4. 创建文章
  // 栏目ID映射:
  //   一级: 1=about 2=notices 3=news 4=first-class-education 5=talent-platform 6=guide
  //   二级: 9=about-brief 10=about-structure
  //         11=notice-teacher 12=notice-student 13=notice-office
  //         14=news-work 15=news-meeting
  //         16=first-class-major 17=first-class-course 18=first-class-teacher 19=first-class-textbook 20=first-class-base
  //         21-27=platform-undergraduate/college/competition/college-mgmt/review/quality-eval/practice
  //         28=regulation-national 29=regulation-school 30=download
  const articleConfigs: Array<{
    columnId: number
    articleSlug: string
    title: string
    content: string
    summary: string
    source: string
    authorId: number
    type: string
    secretLevel: string
    status: string
    visibility: string
    businessTags: string
    isTop: boolean
    isRecommended: boolean
    viewCount: number
    publishedAt?: Date
    scheduledPublishAt?: Date
    coverImageUrl?: string
  }> = [
    // === 通知公告 - 处务通知 (columnId=13) ===
    {
      columnId: 13,
      articleSlug: 'notice-2026-fall-semester-opening',
      title: '关于2026年秋季学期开学工作的通知',
      content: `
        <p>各学院、各部门：</p>
        <p>根据学校校历安排，2026年秋季学期将于9月1日正式开学。为确保新学期各项工作顺利开展，现将有关事项通知如下：</p>
        <p><strong>一、开学时间</strong></p>
        <p>1. 教职工上班时间：2026年8月25日（星期二）</p>
        <p>2. 学生返校注册时间：2026年8月28日（星期五）至8月31日（星期一）</p>
        <p>3. 正式上课时间：2026年9月1日（星期二）</p>
        <p><strong>二、工作要求</strong></p>
        <p>1. 各学院务必在开学前完成教室多媒体设备检修、教材发放等准备工作；</p>
        <p>2. 任课教师应提前备好课，严格按照教学大纲和课程表执行教学任务；</p>
        <p>3. 各学院教务员于9月10日前将本学期开课情况汇总报教务处备案。</p>
        <p>教务处</p>
        <p>2026年7月20日</p>
      `,
      summary: '2026年秋季学期将于9月1日开学，教职工8月25日上班，学生8月28日起返校注册。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['开学通知', '学期工作']),
      isTop: true,
      isRecommended: true,
      viewCount: 2580,
      publishedAt: new Date('2026-07-20T09:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 11,
      articleSlug: 'notice-2026-teaching-competition',
      title: '关于举办2026年度校级教学能力大赛的通知',
      content: `
        <p>各学院：</p>
        <p>为进一步提升教师教学能力和水平，推动教育教学改革，学校决定举办2026年度校级教学能力大赛。现将有关事宜通知如下：</p>
        <p><strong>一、参赛对象</strong></p>
        <p>全校在职专任教师（含实验技术人员），以个人或团队形式参赛。</p>
        <p><strong>二、比赛项目</strong></p>
        <p>1. 教学设计赛道</p>
        <p>2. 课堂教学赛道</p>
        <p>3. 课程思政赛道</p>
        <p><strong>三、时间安排</strong></p>
        <p>报名时间：2026年8月1日—8月15日</p>
        <p>提交材料：2026年9月1日—9月15日</p>
        <p>现场评审：2026年10月10日—10月20日</p>
        <p><strong>四、奖项设置</strong></p>
        <p>一等奖5名、二等奖10名、三等奖20名，优秀组织奖若干。</p>
        <p>教务处</p>
        <p>2026年7月15日</p>
      `,
      summary: '2026年度校级教学能力大赛启动，设教学设计、课堂教学、课程思政三个赛道，8月1日开始报名。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学比赛', '教师发展']),
      isTop: false,
      isRecommended: true,
      viewCount: 1245,
      publishedAt: new Date('2026-07-15T10:30:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 13,
      articleSlug: 'notice-2026-schedule-publish',
      title: '关于公布2026-2027学年第一学期教学运行日历的通知',
      content: `<p>各学院、各教学单位：</p>
        <p>2026-2027学年第一学期教学运行日历已经教务处核准，现予以公布，请各单位遵照执行。</p>
        <p>附件：《2026-2027学年第一学期教学运行日历》</p>
        <p>教务处</p>
        <p>2026年7月25日</p>`,
      summary: '2026-2027学年第一学期教学运行日历正式公布，请各教学单位遵照执行。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'pending_review',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学日历']),
      isTop: false,
      isRecommended: false,
      viewCount: 0,
      scheduledPublishAt: new Date('2026-08-01T00:00:00Z'),
      coverImageUrl: '',
    },
    // === 一流育人体系 - 一流专业 (columnId=16) ===
    {
      columnId: 16,
      articleSlug: 'teaching-first-class-major',
      title: '一流本科专业建设点申报指南（2026年）',
      content: `
        <p>为深入贯彻落实教育部《关于实施一流本科专业建设"双万计划"的通知》精神，学校决定开展2026年度一流本科专业建设点申报工作。</p>
        <p><strong>一、申报范围</strong></p>
        <p>全校全日制本科专业，已有国家级一流本科专业建设点的专业不再重复申报。</p>
        <p><strong>二、建设要求</strong></p>
        <p>1. 突出专业内涵建设，以学生发展为中心；</p>
        <p>2. 强化产教融合、校企合作；</p>
        <p>3. 提升专业服务国家战略和地方经济社会发展能力。</p>
        <p><strong>三、申报材料</strong></p>
        <p>1. 《一流本科专业建设点申报表》；</p>
        <p>2. 专业建设基础材料；</p>
        <p>3. 近三年专业建设成果汇总。</p>
        <p>教务处</p>
        <p>2026年6月30日</p>
      `,
      summary: '2026年度一流本科专业建设点申报启动，申报范围为全校全日制本科专业。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['专业建设', '一流本科']),
      isTop: true,
      isRecommended: true,
      viewCount: 3120,
      publishedAt: new Date('2026-06-30T08:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 17,
      articleSlug: 'teaching-online-course',
      title: '精品在线开放课程建设实施方案',
      content: `
        <p>为推动信息技术与教育教学深度融合，学校特制定精品在线开放课程建设实施方案。</p>
        <p><strong>一、建设目标</strong></p>
        <p>建设10门以上校级精品在线开放课程，争取立项3-5门省级在线开放课程。</p>
        <p><strong>二、建设内容</strong></p>
        <p>1. 课程视频资源建设（每门课程不少于40学时视频）；</p>
        <p>2. 课程互动环节设计（讨论、作业、测验等）；</p>
        <p>3. 课程考核体系建设。</p>
        <p><strong>三、建设周期</strong></p>
        <p>建设周期为1年，分三个阶段推进：</p>
        <p>第一阶段（第1-3月）：教学设计与资源筹备；</p>
        <p>第二阶段（第4-9月）：课程录制与制作；</p>
        <p>第三阶段（第10-12月）：课程上线与持续优化。</p>
        <p>教务处</p>
        <p>2026年7月10日</p>
      `,
      summary: '精品在线开放课程建设方案发布，计划建设10门以上校级精品在线课程。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['课程建设', '在线课程']),
      isTop: false,
      isRecommended: true,
      viewCount: 1890,
      publishedAt: new Date('2026-07-10T14:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 16,
      articleSlug: 'teaching-curriculum-reform',
      title: '关于推进新时代本科教育教学改革的若干意见',
      content: `<p>各学院、各部门：</p>
        <p>为深入推进本科教育教学改革，全面提高人才培养质量，学校就新时代本科教育教学改革提出如下意见...</p>
        <p>教务处</p>
        <p>2026年7月1日</p>`,
      summary: '学校发布新时代本科教育教学改革若干意见，聚焦人才培养质量提升。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'draft',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学改革']),
      isTop: false,
      isRecommended: false,
      viewCount: 0,
      coverImageUrl: '',
    },
    // === 教务动态 - 工作动态 (columnId=14) ===
    {
      columnId: 14,
      articleSlug: 'operation-2026-fall-calendar',
      title: '2026-2027学年第一学期教学运行日历',
      content: `
        <p><strong>一、学期时间</strong></p>
        <p>教学时间：2026年9月1日 — 2027年1月13日（共20周）</p>
        <p>其中：第1-2周为新生入学教育周；第3-18周为正常教学周；第19-20周为考试周。</p>
        <p><strong>二、重要节点</strong></p>
        <p>新生报到：8月25日—8月27日</p>
        <p>中秋放假：9月25日—9月27日</p>
        <p>国庆放假：10月1日—10月7日</p>
        <p>期中考试：第10周（11月6日—11月12日）</p>
        <p>元旦放假：1月1日</p>
        <p>期末考试：第19-20周（1月6日—1月13日）</p>
        <p>寒假开始：2027年1月14日</p>
      `,
      summary: '2026-2027学年第一学期教学运行日历发布，共20周教学时间。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学日历', '学期']),
      isTop: true,
      isRecommended: true,
      viewCount: 4280,
      publishedAt: new Date('2026-07-05T09:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 14,
      articleSlug: 'operation-classroom-management',
      title: '关于加强课堂教学管理的通知',
      content: `
        <p>各学院：</p>
        <p>为进一步规范课堂教学秩序，提高教学质量，现就加强课堂教学管理有关事项通知如下：</p>
        <p><strong>一、严格教学纪律</strong></p>
        <p>1. 教师应提前10分钟到教室做好课前准备；</p>
        <p>2. 按时上下课，不得随意迟到、早退或拖堂；</p>
        <p>3. 严格执行教学计划，不得随意调课、停课。</p>
        <p><strong>二、加强学生管理</strong></p>
        <p>1. 严格考勤制度，每节课进行点名；</p>
        <p>2. 学生旷课累计超过该课程总学时1/3的，不得参加该课程期末考试；</p>
        <p>3. 保持教室整洁，禁止在教室内饮食。</p>
        <p><strong>三、强化监督检查</strong></p>
        <p>教务处将组织教学督导不定期进行课堂教学检查。</p>
        <p>教务处</p>
        <p>2026年7月12日</p>
      `,
      summary: '课堂教学管理新规发布，严格考勤和教学纪律，教务处将不定期开展督导检查。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学管理', '课堂纪律']),
      isTop: false,
      isRecommended: false,
      viewCount: 980,
      publishedAt: new Date('2026-07-12T11:00:00Z'),
      coverImageUrl: '',
    },
    // === 通知公告 - 学生公告 (columnId=12) ===
    {
      columnId: 12,
      articleSlug: 'exam-2026-fall-final-exam',
      title: '2026年秋季学期期末考试工作安排',
      content: `
        <p>各学院、各教学单位：</p>
        <p>2026年秋季学期期末考试将于第19-20周（2027年1月6日—1月13日）进行。为做好考试组织工作，现将有关事项通知如下：</p>
        <p><strong>一、考试形式</strong></p>
        <p>1. 闭卷考试：所有公共必修课和大部分专业必修课；</p>
        <p>2. 开卷考试：部分专业选修课，须经学院批准；</p>
        <p>3. 论文/答辩：毕业论文（设计）及部分实践性课程。</p>
        <p><strong>二、考务要求</strong></p>
        <p>1. 各学院于第16周（12月11日前）将考试科目、时间、地点安排报教务处；</p>
        <p>2. 监考教师须提前15分钟到考场，严格执行监考纪律；</p>
        <p>3. 学生须携带有效身份证件和学生证参加考试。</p>
        <p><strong>三、成绩管理</strong></p>
        <p>各任课教师须在考试结束后7个工作日内完成成绩录入。</p>
        <p>教务处</p>
        <p>2026年7月18日</p>
      `,
      summary: '2026年秋季学期期末考试安排发布，考试时间为2027年1月6日至13日。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['期末考试', '考务']),
      isTop: true,
      isRecommended: true,
      viewCount: 3560,
      publishedAt: new Date('2026-07-18T09:30:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 12,
      articleSlug: 'exam-cet-2026-fall',
      title: '关于2026年下半年全国大学英语四、六级考试报名的通知',
      content: `
        <p>各学院：</p>
        <p>2026年下半年全国大学英语四、六级考试将于12月14日举行，报名工作即将开始。</p>
        <p><strong>一、报名时间</strong></p>
        <p>2026年9月10日 — 9月25日</p>
        <p><strong>二、报名资格</strong></p>
        <p>1. 修完大学英语课程的在校本科生；</p>
        <p>2. CET-4成绩达到500分以上者可报考CET-6；</p>
        <p>3. 每名学生限报一个级别。</p>
        <p><strong>三、考试时间</strong></p>
        <p>CET-4：2026年12月14日 09:00-11:20</p>
        <p>CET-6：2026年12月14日 15:00-17:25</p>
        <p><strong>四、报名方式</strong></p>
        <p>学生登录教务系统"在线报名"模块进行网上报名。</p>
        <p>教务处</p>
        <p>2026年7月22日</p>
      `,
      summary: '2026年下半年CET考试报名启动，考试时间为12月14日，9月10日开始网上报名。',
      source: '教务处考试中心',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['CET', '英语考试', '报名']),
      isTop: false,
      isRecommended: true,
      viewCount: 5620,
      publishedAt: new Date('2026-07-22T10:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 13,
      articleSlug: 'exam-makeup-policy',
      title: '关于进一步规范补考工作的实施办法',
      content: `<p>各学院：</p>
        <p>为进一步规范补考管理，确保补考工作公平、公正、公开，现就补考工作的组织、管理等作出如下规定...</p>
        <p>教务处</p>
        <p>2026年7月8日</p>`,
      summary: '补考管理新规出台，进一步规范补考工作流程和要求。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'pending_review',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['补考', '考务管理']),
      isTop: false,
      isRecommended: false,
      viewCount: 0,
      scheduledPublishAt: new Date('2026-09-01T00:00:00Z'),
      coverImageUrl: '',
    },
    // === 一流育人体系 - 一流教师 (columnId=18) ===
    {
      columnId: 18,
      articleSlug: 'quality-2026-midterm-report',
      title: '2026年上半年教学质量评估报告',
      content: `
        <p><strong>一、评估概况</strong></p>
        <p>2026年上半年，学校对全校386门课程开展了教学质量评估工作，覆盖学生28000余人次。</p>
        <p><strong>二、评估结果</strong></p>
        <p>1. 学生满意度：平均92.5分（满分100分），较上学期提升1.2分；</p>
        <p>2. 优良率：89.3%的课程评估结果为优良；</p>
        <p>3. 不合格课程：共12门，占比3.1%。</p>
        <p><strong>三、主要问题</strong></p>
        <p>1. 部分大班课师生互动不足；</p>
        <p>2. 实践教学环节有待加强；</p>
        <p>3. 多媒体教学手段需进一步丰富。</p>
        <p><strong>四、改进措施</strong></p>
        <p>1. 对评估不合格课程进行专项帮扶；</p>
        <p>2. 开展教学观摩和教学培训；</p>
        <p>3. 建立教学质量持续改进机制。</p>
        <p>教务处</p>
        <p>2026年7月26日</p>
      `,
      summary: '2026年上半年教学质量评估报告发布，学生满意度达92.5分，优良率89.3%。',
      source: '教务处教学质量评估中心',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['教学评估', '教学质量']),
      isTop: true,
      isRecommended: true,
      viewCount: 2150,
      publishedAt: new Date('2026-07-26T15:00:00Z'),
      coverImageUrl: '',
    },
    {
      columnId: 18,
      articleSlug: 'quality-student-evaluation',
      title: '关于开展2026年秋季学期学生评教工作的通知',
      content: `
        <p>各位同学：</p>
        <p>为持续提升教学质量，学校将于本学期开展学生评教工作。</p>
        <p><strong>一、评教时间</strong></p>
        <p>2026年11月1日 — 2026年12月15日</p>
        <p><strong>二、评教方式</strong></p>
        <p>学生登录教务系统，进入"学生评教"模块，对本学期所有修读课程进行评价。</p>
        <p><strong>三、评教要求</strong></p>
        <p>1. 每位学生须对本学期所有修读课程进行评价；</p>
        <p>2. 评价内容包括：教学态度、教学内容、教学方法、教学效果等维度；</p>
        <p>3. 评教结果将作为教师绩效考核和职称评审的重要依据。</p>
        <p>教务处</p>
        <p>2026年7月28日</p>
      `,
      summary: '2026年秋季学期学生评教工作将于11月1日启动，评教结果将纳入教师绩效考核。',
      source: '教务处',
      authorId: 1,
      type: 'normal',
      secretLevel: 'normal',
      status: 'published',
      visibility: 'PUBLIC',
      businessTags: JSON.stringify(['学生评教', '教学质量']),
      isTop: false,
      isRecommended: false,
      viewCount: 680,
      publishedAt: new Date('2026-07-28T09:00:00Z'),
      coverImageUrl: '',
    },
  ]

  const articleIds = new Map<string, number>()

  for (const cfg of articleConfigs) {
    const result = await prisma.article.upsert({
      where: { articleSlug: cfg.articleSlug },
      create: {
        columnId: cfg.columnId,
        articleSlug: cfg.articleSlug,
        title: cfg.title,
        content: cfg.content,
        summary: cfg.summary,
        source: cfg.source,
        authorId: cfg.authorId,
        type: cfg.type,
        secretLevel: cfg.secretLevel,
        status: cfg.status,
        visibility: cfg.visibility,
        businessTags: cfg.businessTags,
        isTop: cfg.isTop,
        isRecommended: cfg.isRecommended,
        viewCount: cfg.viewCount,
        publishedAt: cfg.publishedAt,
        scheduledPublishAt: cfg.scheduledPublishAt ?? null,
        coverImageUrl: cfg.coverImageUrl ?? null,
      },
      update: {
        columnId: cfg.columnId,
        title: cfg.title,
        content: cfg.content,
        summary: cfg.summary,
        source: cfg.source,
        status: cfg.status,
        isTop: cfg.isTop,
        isRecommended: cfg.isRecommended,
        viewCount: cfg.viewCount,
        publishedAt: cfg.publishedAt,
        scheduledPublishAt: cfg.scheduledPublishAt ?? null,
        coverImageUrl: cfg.coverImageUrl ?? null,
      },
    })
    articleIds.set(cfg.articleSlug, result.id)
    console.log(`  ✓ Article: ${cfg.title} [${cfg.status}] (id:${result.id})`)
  }

  // 5. 创建首页轮播图 (HomepageCarousel)
  const carouselConfigs: Array<{
    positionCode: string
    articleSlug: string
    sortOrder: number
    status: string
  }> = [
    { positionCode: 'CAROUSEL_A', articleSlug: 'notice-2026-fall-semester-opening', sortOrder: 1, status: 'ACTIVE' },
    { positionCode: 'CAROUSEL_A', articleSlug: 'teaching-first-class-major', sortOrder: 2, status: 'ACTIVE' },
    { positionCode: 'CAROUSEL_A', articleSlug: 'exam-cet-2026-fall', sortOrder: 3, status: 'ACTIVE' },
    { positionCode: 'CAROUSEL_A', articleSlug: 'quality-2026-midterm-report', sortOrder: 4, status: 'ACTIVE' },
    { positionCode: 'CAROUSEL_B', articleSlug: 'operation-2026-fall-calendar', sortOrder: 1, status: 'ACTIVE' },
  ]

  for (const cc of carouselConfigs) {
    const articleId = articleIds.get(cc.articleSlug)
    if (!articleId) {
      console.log(`  ⚠ Skipping carousel for ${cc.articleSlug} - article not found`)
      continue
    }
    await prisma.homepageCarousel.upsert({
      where: {
        positionCode_articleId: {
          positionCode: cc.positionCode,
          articleId,
        },
      },
      create: {
        positionCode: cc.positionCode,
        articleId,
        sortOrder: cc.sortOrder,
        status: cc.status,
      },
      update: {
        sortOrder: cc.sortOrder,
        status: cc.status,
      },
    })
    console.log(`  ✓ Carousel: ${cc.positionCode} → article#${articleId} (sort:${cc.sortOrder})`)
  }

  // 6. 创建办事指南 (GuideItems)
  const guideConfigs: Array<{
    title: string
    slug: string
    targetAudience: 'student' | 'teacher' | 'visitor'
    businessTag: string
    targetObject: string
    processSteps: string
    requiredMaterials: string
    timeLimit: string
    contactDept: string
    contactPhone: string
    contactAddress?: string
    contactEmail?: string
    columnId?: number
    sortOrder: number
    status: 'draft' | 'published' | 'offline'
    createdBy: number
    viewCount: number
  }> = [
    {
      title: '学生休学申请',
      slug: 'student-suspension',
      targetAudience: 'student',
      businessTag: 'academic-affairs',
      targetObject: JSON.stringify({
        categories: [
          { name: '本科生', description: '全日制在校本科生休学申请' },
          { name: '研究生', description: '全日制在校研究生休学申请' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '学生申请', description: '学生本人登录教务系统填写休学申请表' },
        { step: 2, name: '辅导员审核', description: '辅导员核实情况并签署意见' },
        { step: 3, name: '院系审批', description: '院系领导审核批准' },
        { step: 4, name: '教务处备案', description: '教务处学籍管理科备案并更新学籍信息' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '休学申请表', description: '加盖院系公章的休学申请表', required: true },
        { name: '申请理由证明', description: '因病休学需提供医院诊断证明；因其他原因需提供相关证明材料', required: true },
        { name: '家长知情书', description: '家长知情并同意的书面材料（本科生）', required: true },
        { name: '身份证件', description: '申请人身份证原件及复印件', required: false },
      ]),
      timeLimit: '自受理之日起15个工作日内完成审批',
      contactDept: '教务处学籍管理科',
      contactPhone: '0755-23332001',
      contactAddress: '行政楼A301',
      contactEmail: 'xjgl@sziit.edu.cn',
      columnId: 6,
      sortOrder: 1,
      status: 'published',
      createdBy: 1,
      viewCount: 3420,
    },
    {
      title: '学生成绩复议',
      slug: 'student-grade-appeal',
      targetAudience: 'student',
      businessTag: 'academic-affairs',
      targetObject: JSON.stringify({
        categories: [
          { name: '成绩复议', description: '对考试成绩有异议的学生可申请成绩复议' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '学生提交申请', description: '学生在成绩公布后5个工作日内登录教务系统提交复议申请' },
        { step: 2, name: '院系受理', description: '院系教务员受理复议申请并转交任课教师' },
        { step: 3, name: '教师核查', description: '任课教师核查试卷评分情况并反馈核查结果' },
        { step: 4, name: '结果反馈', description: '院系将核查结果反馈给学生，并在系统中更新成绩（如需修改）' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '成绩复议申请表', description: '学生在线填写的成绩复议申请表', required: true },
        { name: '相关证明材料', description: '如考试答卷复印件等', required: false },
      ]),
      timeLimit: '自成绩公布之日起5个工作日内申请，10个工作日内反馈结果',
      contactDept: '各学院教务办公室',
      contactPhone: '0755-23332000',
      contactAddress: '各学院办公楼',
      contactEmail: 'jwc@sziit.edu.cn',
      columnId: 3,
      sortOrder: 2,
      status: 'published',
      createdBy: 1,
      viewCount: 2180,
    },
    {
      title: '教师调课申请',
      slug: 'teacher-course-adjustment',
      targetAudience: 'teacher',
      businessTag: 'academic-affairs',
      targetObject: JSON.stringify({
        categories: [
          { name: '调课申请', description: '教师因特殊原因需要调整上课时间或地点' },
          { name: '代课申请', description: '教师因故不能上课需要其他教师代课' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '教师申请', description: '任课教师登录教务系统提交调课/代课申请' },
        { step: 2, name: '院系审批', description: '院系教务负责人审批调课申请' },
        { step: 3, name: '教务处备案', description: '教务处教学运行科备案并更新课表' },
        { step: 4, name: '通知学生', description: '调课信息通过教务系统和短信通知学生' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '调课原因说明', description: '详细说明调课原因及调整方案', required: true },
        { name: '课程调整审批表', description: '院系领导签字盖章的审批表', required: true },
      ]),
      timeLimit: '至少提前3个工作日申请',
      contactDept: '教务处教学运行科',
      contactPhone: '0755-23332010',
      contactAddress: '行政楼A305',
      contactEmail: 'jxxl@sziit.edu.cn',
      columnId: 3,
      sortOrder: 3,
      status: 'published',
      createdBy: 1,
      viewCount: 1560,
    },
    {
      title: '学生考试违纪处理申诉',
      slug: 'student-ex-appeal',
      targetAudience: 'student',
      businessTag: 'exam-management',
      targetObject: JSON.stringify({
        categories: [
          { name: '考试违纪申诉', description: '学生对考试违纪处理决定不服的可申诉' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '提交申诉', description: '学生在收到处理决定书之日起5个工作日内提出书面申诉' },
        { step: 2, name: '院系受理', description: '院系学生工作领导小组受理并核实' },
        { step: 3, name: '学校复核', description: '教务处会同相关部门进行复核' },
        { step: 4, name: '结果反馈', description: '复核结论书面反馈给学生' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '申诉书', description: '详细说明申诉理由和相关证据', required: true },
        { name: '处理决定书', description: '原处理决定书复印件', required: true },
        { name: '相关证据材料', description: '支持申诉理由的相关证据', required: false },
      ]),
      timeLimit: '自收到处理决定之日起5个工作日内提出',
      contactDept: '教务处考务科',
      contactPhone: '0755-23332020',
      contactAddress: '行政楼A307',
      contactEmail: 'kwk@sziit.edu.cn',
      columnId: 4,
      sortOrder: 4,
      status: 'published',
      createdBy: 1,
      viewCount: 890,
    },
    {
      title: '访客咨询服务',
      slug: 'visitor-inquiry',
      targetAudience: 'visitor',
      businessTag: 'general',
      targetObject: JSON.stringify({
        categories: [
          { name: '招生咨询', description: '招生政策、专业介绍、录取分数等咨询' },
          { name: '办事咨询', description: '办事流程、材料要求等信息咨询' },
          { name: '教学咨询', description: '课程安排、师资力量等咨询' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '线上咨询', description: '通过教务处官网"在线咨询"或留言系统提交咨询' },
        { step: 2, name: '专员回复', description: '教务处工作人员在3个工作日内回复' },
        { step: 3, name: '现场咨询', description: '可携带相关材料到教务处办事大厅现场咨询' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '身份证明', description: '现场咨询需携带有效身份证件', required: false },
        { name: '相关材料', description: '与咨询事项相关的材料', required: false },
      ]),
      timeLimit: '线上咨询3个工作日内回复，现场咨询即时办理',
      contactDept: '教务处综合办公室',
      contactPhone: '0755-23332000',
      contactAddress: '行政楼A300',
      contactEmail: 'jwc@sziit.edu.cn',
      sortOrder: 5,
      status: 'published',
      createdBy: 1,
      viewCount: 5230,
    },
    {
      title: '教师课程考核方案备案',
      slug: 'teacher-exam-plan-filing',
      targetAudience: 'teacher',
      businessTag: 'exam-management',
      targetObject: JSON.stringify({
        categories: [
          { name: '考核方案备案', description: '任课教师将课程考核方案提交教务处备案' },
        ],
      }),
      processSteps: JSON.stringify([
        { step: 1, name: '制定方案', description: '任课教师根据教学大纲制定课程考核方案' },
        { step: 2, name: '院系审核', description: '院系教学指导委员会审核考核方案' },
        { step: 3, name: '网上提交', description: '教师登录教务系统上传考核方案并提交备案' },
        { step: 4, name: '教务处复核', description: '教务处复核考核方案的合规性' },
      ]),
      requiredMaterials: JSON.stringify([
        { name: '课程考核方案表', description: '含考核方式、考核内容、成绩评定标准等', required: true },
        { name: '教学大纲', description: '课程教学大纲', required: true },
      ]),
      timeLimit: '开课后2周内完成备案',
      contactDept: '教务处考务科',
      contactPhone: '0755-23332020',
      contactAddress: '行政楼A307',
      contactEmail: 'kwk@sziit.edu.cn',
      columnId: 4,
      sortOrder: 6,
      status: 'published',
      createdBy: 1,
      viewCount: 720,
    },
  ]

  for (const gc of guideConfigs) {
    await prisma.guideItem.upsert({
      where: { slug: gc.slug },
      create: {
        title: gc.title,
        slug: gc.slug,
        targetAudience: gc.targetAudience,
        businessTag: gc.businessTag,
        targetObject: gc.targetObject,
        processSteps: gc.processSteps,
        requiredMaterials: gc.requiredMaterials,
        timeLimit: gc.timeLimit,
        contactDept: gc.contactDept,
        contactPhone: gc.contactPhone,
        contactAddress: gc.contactAddress ?? null,
        contactEmail: gc.contactEmail ?? null,
        columnId: gc.columnId ?? null,
        sortOrder: gc.sortOrder,
        status: gc.status,
        createdBy: gc.createdBy,
        viewCount: gc.viewCount,
      },
      update: {
        title: gc.title,
        targetAudience: gc.targetAudience,
        businessTag: gc.businessTag,
        targetObject: gc.targetObject,
        processSteps: gc.processSteps,
        requiredMaterials: gc.requiredMaterials,
        timeLimit: gc.timeLimit,
        contactDept: gc.contactDept,
        contactPhone: gc.contactPhone,
        contactAddress: gc.contactAddress ?? null,
        contactEmail: gc.contactEmail ?? null,
        columnId: gc.columnId ?? null,
        sortOrder: gc.sortOrder,
        status: gc.status,
        viewCount: gc.viewCount,
      },
    })
    console.log(`  ✓ GuideItem: ${gc.title} (${gc.targetAudience})`)
  }

  // 7. 创建敏感词 (SensitiveWords)
  const sensitiveWordConfigs: Array<{
    word: string
    level: 'LOW' | 'HIGH'
    category: 'political' | 'pornographic' | 'violent' | 'advertising' | 'other'
    isActive: boolean
  }> = [
    // 政治类
    { word: '境外势力', level: 'HIGH', category: 'political', isActive: true },
    { word: '非法集会', level: 'HIGH', category: 'political', isActive: true },
    { word: '舆论引导', level: 'LOW', category: 'political', isActive: true },
    { word: '敏感事件', level: 'LOW', category: 'political', isActive: true },
    // 暴力类
    { word: '暴力行为', level: 'HIGH', category: 'violent', isActive: true },
    { word: '血腥场面', level: 'HIGH', category: 'violent', isActive: true },
    { word: '斗殴', level: 'HIGH', category: 'violent', isActive: true },
    { word: '自残', level: 'HIGH', category: 'violent', isActive: true },
    { word: '自杀方法', level: 'HIGH', category: 'violent', isActive: true },
    // 广告违禁词
    { word: '最佳', level: 'LOW', category: 'advertising', isActive: true },
    { word: '唯一', level: 'LOW', category: 'advertising', isActive: true },
    { word: '国家级', level: 'LOW', category: 'advertising', isActive: true },
    { word: '最高级', level: 'LOW', category: 'advertising', isActive: true },
    { word: '第一品牌', level: 'LOW', category: 'advertising', isActive: true },
    { word: '绝对', level: 'LOW', category: 'advertising', isActive: true },
    { word: '100%', level: 'LOW', category: 'advertising', isActive: true },
    // 色情低俗
    { word: '低俗内容', level: 'HIGH', category: 'pornographic', isActive: true },
    { word: '不雅视频', level: 'HIGH', category: 'pornographic', isActive: true },
    // 其他
    { word: '泄密', level: 'HIGH', category: 'other', isActive: true },
    { word: '内部机密', level: 'HIGH', category: 'other', isActive: true },
    { word: '涉密信息', level: 'HIGH', category: 'other', isActive: true },
    { word: '数据泄露', level: 'HIGH', category: 'other', isActive: true },
    { word: '代考', level: 'HIGH', category: 'other', isActive: true },
    { word: '作弊', level: 'HIGH', category: 'other', isActive: true },
    { word: '替考', level: 'HIGH', category: 'other', isActive: true },
    { word: '黑客攻击', level: 'HIGH', category: 'other', isActive: true },
    { word: '系统入侵', level: 'HIGH', category: 'other', isActive: true },
    { word: '刷单', level: 'LOW', category: 'other', isActive: true },
    { word: '外挂', level: 'LOW', category: 'other', isActive: true },
  ]

  for (const sw of sensitiveWordConfigs) {
    await prisma.sensitiveWord.upsert({
      where: { word: sw.word },
      create: {
        word: sw.word,
        level: sw.level,
        category: sw.category,
        isActive: sw.isActive,
        createdBy: 1,
      },
      update: {
        level: sw.level,
        category: sw.category,
        isActive: sw.isActive,
      },
    })
    console.log(`  ✓ SensitiveWord: ${sw.word} [${sw.level}/${sw.category}]`)
  }

  console.log('\nSeed completed!')
  console.log('Test accounts:')
  console.log('  editor / 123456       → 编辑管理员')
  console.log('  reviewer / 123456     → 审核管理员')
  console.log('  column_admin / 123456 → 栏目管理员')
  console.log('  system_admin / 123456 → 系统管理员')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())