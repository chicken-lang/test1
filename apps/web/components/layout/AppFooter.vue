<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <div class="footer-grid">
        <!-- 联系方式(FR-01.12) -->
        <div class="footer-col">
          <h3 class="footer-title">联系我们</h3>
          <ul class="footer-list">
            <li>
              <Icon icon="mdi:map-marker" width="16" height="16" />
              <span>深圳市龙岗区龙翔大道2188号</span>
            </li>
            <li>
              <Icon icon="mdi:phone" width="16" height="16" />
              <span>0755-89226666</span>
            </li>
            <li>
              <Icon icon="mdi:email" width="16" height="16" />
              <span>jwc@sziit.edu.cn</span>
            </li>
            <li>
              <Icon icon="mdi:postage-stamp" width="16" height="16" />
              <span>邮编:518172</span>
            </li>
          </ul>
        </div>

        <!-- 友情链接(FR-01.10) -->
        <div class="footer-col">
          <h3 class="footer-title">友情链接</h3>
          <ul class="footer-list">
            <li v-for="link in friendLinks" :key="link.url">
              <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.name }}</a>
            </li>
          </ul>
        </div>

        <!-- 快捷入口 -->
        <div class="footer-col">
          <h3 class="footer-title">快捷入口</h3>
          <ul class="footer-list">
            <li v-for="link in quickLinks" :key="link.url">
              <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.title }}</a>
            </li>
          </ul>
        </div>

        <!-- 微信公众号二维码(FR-01.11) -->
        <div class="footer-col footer-qr">
          <h3 class="footer-title">关注我们</h3>
          <div class="qr-placeholder">
            <Icon icon="mdi:qrcode" width="100" height="100" />
            <p>教务处公众号</p>
          </div>
        </div>
      </div>

      <!-- 底部版权 + 备案号 -->
      <div class="footer-bottom">
        <p>
          © {{ new Date().getFullYear() }} 深圳信息职业技术大学教务处 ·
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
            粤ICP备12345678号
          </a>
        </p>
        <div class="footer-extra">
          <NuxtLink to="/sitemap">站点地图</NuxtLink>
          <NuxtLink to="/accessibility">无障碍说明</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// AppFooter: 联系方式 + 友情链接 + 快捷入口 + 公众号二维码 + 备案号
// 对应 FR-01.10/11/12 通用页脚

// Mock 友情链接(后续接 QuickLink API)
const friendLinks = [
  { name: '深圳信息职业技术大学', url: 'https://www.sziit.edu.cn' },
  { name: '广东省教育厅', url: 'https://edu.gd.gov.cn' },
  { name: '教育部', url: 'https://www.moe.gov.cn' },
  { name: '中国教育在线', url: 'https://www.eol.cn' },
]

// Mock 快捷入口(对应 FR-17 外部系统)
const quickLinks = [
  { title: '教务管理系统', url: '#' },
  { title: '学生服务系统', url: '#' },
  { title: '网络教学平台', url: '#' },
  { title: '成绩查询系统', url: '#' },
]
</script>

<style lang="scss" scoped>
.app-footer {
  background: $primary-dark;
  color: rgba(255, 255, 255, 0.85);
  padding: 40px 0 0;
  margin-top: 40px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 32px;
  padding-bottom: 32px;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.footer-list {
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    font-size: 14px;

    a {
      color: rgba(255, 255, 255, 0.75);
      transition: color 0.2s;

      &:hover {
        color: #fff;
      }
    }
  }
}

.footer-qr {
  text-align: center;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);

  p {
    font-size: 14px;
  }
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;

  a {
    color: rgba(255, 255, 255, 0.7);

    &:hover {
      color: #fff;
    }
  }
}

.footer-extra {
  display: flex;
  gap: 20px;
}

// 移动端
@include respond-to(xs) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
