import { Controller, Get } from '@nestjs/common'
import { ApiResponseHelper } from '../../common/dto/api-response.js'

@Controller('public/about')
export class PublicAboutController {
  @Get()
  async getAbout() {
    const data = {
      brief: '教务处是学校主管本科教育教学工作的职能部门，负责全校本科生的教学管理、学籍管理、教学改革、教学质量监控等工作。',
      history: '教务处始终坚持以立德树人为根本任务，致力于推动学校本科教育高质量发展。',
      // 字段对齐前端 about.vue 模板：avatar / title / duty（非 position / photo / intro）
      leaders: [
        { id: 1, name: '张主任', avatar: 'mdi:account-tie', title: '教务处处长', duty: '主持教务处全面工作' },
        { id: 2, name: '李副主任', avatar: 'mdi:account-tie', title: '副处长', duty: '分管教学管理工作' },
        { id: 3, name: '王副主任', avatar: 'mdi:account-tie', title: '副处长', duty: '分管学籍与考试工作' },
      ],
      // 字段对齐前端模板：duty / leader / phone / staff（非 description 单字段）
      divisions: [
        {
          id: 1,
          name: '教学管理科',
          duty: '负责课程安排、教学任务落实',
          leader: '刘芳',
          phone: '0755-89226666-8001',
          staff: [
            { name: '刘芳', role: '科长' },
            { name: '赵敏', role: '科员' },
          ],
        },
        {
          id: 2,
          name: '学籍管理科',
          duty: '负责学生学籍异动、毕业审核',
          leader: '陈刚',
          phone: '0755-89226666-8002',
          staff: [
            { name: '陈刚', role: '科长' },
            { name: '李静', role: '科员' },
          ],
        },
        {
          id: 3,
          name: '考试管理科',
          duty: '负责各类考试的组织与实施',
          leader: '王强',
          phone: '0755-89226666-8003',
          staff: [
            { name: '王强', role: '科长' },
          ],
        },
        {
          id: 4,
          name: '教学质量科',
          duty: '负责教学质量监控与评估',
          leader: '孙丽',
          phone: '0755-89226666-8004',
          staff: [
            { name: '孙丽', role: '科长' },
            { name: '周明', role: '科员' },
          ],
        },
      ],
      duties: [
        '制定和组织实施学校本科教育教学工作计划',
        '负责全校课程体系建设与教学改革',
        '组织实施各类教学检查与评估工作',
        '负责学生学籍管理及相关证明出具',
        '组织校级以上各类考试的考务工作',
      ],
      contact: {
        address: '行政楼A区301室',
        phone: '0755-89226666',
        email: 'jwc@sziit.edu.cn',
        officeHours: '周一至周五 8:30-17:00',
      },
    }
    return ApiResponseHelper.success(data)
  }
}
