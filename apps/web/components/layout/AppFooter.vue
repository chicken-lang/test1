<template>
  <footer class="app-footer">
    <!-- 主信息区 -->
    <div class="container footer-main">
      <!-- 左侧:校徽 + 简介 -->
      <div class="footer-brand">
        <div class="footer-logo">
          <SchoolEmblem :size="44" mono class="footer-emblem" />
          <div class="footer-brand-text">
            <div class="footer-school">深圳信息职业技术大学</div>
            <div class="footer-dept">教务处 · Academic Affairs Office</div>
          </div>
        </div>
        <p class="footer-brief">
          致力于为全校师生提供教学管理、实践教学、专业建设等一站式服务,推动教学改革创新,提升人才培养质量。
        </p>
      </div>

      <!-- 右侧:链接区 -->
      <div class="footer-links">
        <div class="footer-col">
          <h3 class="footer-title">联系我们</h3>
          <ul class="footer-list">
            <li>
              <Icon :icon="icons.location" :width="15" :height="15" />
              <span>深圳市龙岗区龙翔大道2188号</span>
            </li>
            <li>
              <Icon :icon="icons.phone" :width="15" :height="15" />
              <span>0755-89226666</span>
            </li>
            <li>
              <Icon :icon="icons.email" :width="15" :height="15" />
              <span>jwc@sziit.edu.cn</span>
            </li>
            <li>
              <Icon :icon="icons.document" :width="15" :height="15" />
              <span>邮编:518172</span>
            </li>
          </ul>
        </div>

        <div class="footer-col">
          <h3 class="footer-title">友情链接</h3>
          <ul class="footer-list">
            <li v-for="link in friendLinks" :key="link.url">
              <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.name }}</a>
            </li>
          </ul>
        </div>

        <div class="footer-col">
          <h3 class="footer-title">快捷入口</h3>
          <ul class="footer-list">
            <li v-for="link in quickLinks" :key="link.title">
              <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.title }}</a>
            </li>
          </ul>
        </div>

        <div class="footer-col footer-qr">
          <h3 class="footer-title">关注我们</h3>
          <div class="qr-box">
            <div class="qr-img">
              <Icon :icon="icons.image" :width="80" :height="80" />
            </div>
            <p class="qr-text">扫码关注教务处公众号</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p class="copyright">
          © {{ new Date().getFullYear() }} 深圳信息职业技术大学教务处 ·
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
            粤ICP备12345678号
          </a>
        </p>
        <div class="footer-extra">
          <NuxtLink to="/sitemap">站点地图</NuxtLink>
          <span class="dot">·</span>
          <NuxtLink to="/accessibility">无障碍说明</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// AppFooter v3.0: SchoolEmblem 组件 + icons 字典
import { icons } from '~/utils/icons'

const friendLinks = [
  { name: '深圳信息职业技术大学', url: 'https://www.sziit.edu.cn' },
  { name: '广东省教育厅', url: 'https://edu.gd.gov.cn' },
  { name: '教育部', url: 'https://www.moe.gov.cn' },
  { name: '中国教育在线', url: 'https://www.eol.cn' },
]

const quickLinks = [
  { title: '教务管理系统', url: '#' },
  { title: '学生服务系统', url: '#' },
  { title: '网络教学平台', url: '#' },
  { title: '成绩查询系统', url: '#' },
]
</script>

<style lang="scss" scoped>
.app-footer {
  background: $grad-dark;
  color: rgba(255, 255, 255, 0.75);
  margin-top: $space-12;
}

.footer-main {
  display: grid;
  grid-template-columns: 1.2fr 2.8fr;
  gap: $space-12;
  padding: $space-12 0 $space-8;
}

// 品牌区
.footer-brand {
  padding-right: $space-8;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;
}

.footer-emblem {
  flex-shrink: 0;
  color: $gold-light;
}

.footer-school {
  font-size: $fs-md;
  font-weight: $fw-semibold;
  color: #fff;
  letter-spacing: 1px;
}

.footer-dept {
  font-size: $fs-xs;
  color: $gold-light;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.footer-brief {
  font-size: $fs-sm;
  line-height: $lh-relaxed;
  color: rgba(255, 255, 255, 0.6);
}

// 链接区
.footer-links {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.2fr;
  gap: $space-8;
}

.footer-col {
  .footer-title {
    font-size: $fs-base;
    font-weight: $fw-semibold;
    color: #fff;
    margin-bottom: $space-4;
    padding-bottom: $space-2;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 24px;
      height: 2px;
      background: $grad-gold;
      border-radius: $radius-pill;
    }
  }
}

.footer-list {
  li {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-bottom: $space-3;
    font-size: $fs-sm;
    color: rgba(255, 255, 255, 0.65);

    :deep(svg) {
      color: $gold;
      flex-shrink: 0;
    }

    a {
      color: rgba(255, 255, 255, 0.65);
      transition: all $transition-fast;

      &:hover {
        color: $gold-light;
        padding-left: $space-1;
      }
    }
  }
}

// 二维码
.footer-qr {
  text-align: center;

  .qr-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
  }

  .qr-img {
    width: 96px;
    height: 96px;
    background: #fff;
    border-radius: $radius-base;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-2;
    box-shadow: $shadow-md;

    :deep(svg) {
      color: $primary-dark;
    }
  }

  .qr-text {
    font-size: $fs-xs;
    color: rgba(255, 255, 255, 0.6);
  }
}

// 底部版权
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: $space-5 0;
}

.footer-bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $fs-sm;
  color: rgba(255, 255, 255, 0.5);

  .copyright a {
    color: rgba(255, 255, 255, 0.5);

    &:hover {
      color: $gold-light;
    }
  }
}

.footer-extra {
  display: flex;
  align-items: center;
  gap: $space-2;

  a {
    color: rgba(255, 255, 255, 0.5);

    &:hover {
      color: $gold-light;
    }
  }

  .dot {
    color: rgba(255, 255, 255, 0.3);
  }
}

// 平板: 链接区 2 列
@include respond-to(sm) {
  .footer-links {
    grid-template-columns: 1fr 1fr;
    gap: $space-6;
  }
}

// 移动端
@include respond-to(xs) {
  .footer-main {
    grid-template-columns: 1fr;
    gap: $space-8;
    padding: $space-8 0 $space-6;
  }

  .footer-brand {
    padding-right: 0;
  }

  .footer-links {
    grid-template-columns: 1fr 1fr;
    gap: $space-6;
  }

  .footer-bottom-inner {
    flex-direction: column;
    gap: $space-3;
    text-align: center;
  }
}
</style>
