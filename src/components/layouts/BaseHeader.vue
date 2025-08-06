<template>
  <el-affix>
    <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false">
      <el-menu-item index="1" @click="handleChange(1)">
        <img
          style="width: 100px;height: 100%;min-height: 58px;"
          src="../../images/logo.svg"
          alt="logo"
        />
      </el-menu-item>
      <div class="flex-grow" />
      <el-sub-menu index="2">
        <template #title>加密/解密</template>
        <el-menu-item index="2-1" @click="handleChange('/encryption/SM4')">SM4 加密/解密</el-menu-item>
        <el-menu-item index="2-2" @click="handleChange('/encryption/AES')">AES 加密/解密</el-menu-item>
      </el-sub-menu>
      <el-menu-item index="3" @click="handleChange('/format')">JSON格式化</el-menu-item>
      <el-menu-item index="4" @click="handleChange('/base64')">Base64转换</el-menu-item>
      <el-sub-menu index="5">
        <template #title>其他工具</template>
        <el-menu-item index="5-1" @click="handleChange('/contrast')">代码对比</el-menu-item>
        <el-menu-item index="5-2" @click="handleChange('/calendar')">日历</el-menu-item>
        <el-menu-item index="5-2" @click="handleChange('/timestamp')">时间戳转换</el-menu-item>
        <el-menu-item index="5-3" @click="handleChange('/color')">颜色转换</el-menu-item>
      </el-sub-menu>
      <!-- <el-menu-item index="0" h="full" class="s-icon">
        <button
          class="border-none w-full bg-transparent cursor-pointer"
          style="height: var(--ep-menu-item-height)"
          @click="toggleTheme"
        >
          <i inline-flex i="dark:ep-moon ep-sunny" />
        </button>
      </el-menu-item> -->
      <div class="si">
        <div class="container">
          <label for="switch" class="toggle">
            <input type="checkbox" class="input" id="switch" v-model="isCheck" @click="toggleTheme" />
            <div class="icon icon--moon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </div>

            <div class="icon icon--sun">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24"
                height="24"
              >
                <path
                  d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
                ></path>
              </svg>
            </div>
          </label>
        </div>
      </div>
    </el-menu>
  </el-affix>
  <el-backtop :bottom="100" />
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useDark } from "@vueuse/core";

const router = useRouter();

let isCheck = false;

const handleChange = (_val: any) => {
  if (_val == 1) {
    router.push("/");
  } else {
    router.push(_val);
  }
};

// 如果有存储的主题值，使用存储的，没有则默认暗黑模式
if (localStorage.getItem("theme")) {
  if (localStorage.getItem("theme") == "light") {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    isCheck = true
  } else {
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
    isCheck = false
  }
} else {
  document.documentElement.classList.remove('light')
  document.documentElement.classList.add('dark')
}

const toggleTheme = (event: MouseEvent) => {

  // 存储选择的主题
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
  
  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  let isDark: boolean

  setTimeout(function () {
      // @ts-ignore
    const transition = document.startViewTransition(() => {
      const root = document.documentElement
      isDark = root.classList.contains('dark')
      root.classList.remove(isDark ? 'dark' : 'light')
      root.classList.add(isDark ? 'light' : 'dark')

      // JsonEditorVue插件主题切换
      const j = document.getElementById('JsonEditorVue')
      if (j != null) {
        if (isDark) {
          j.className = 'my-json-editor'
        } else {
          j.className = 'my-json-editor jse-theme-dark'
        }
      }
    
      // 代码对比插件主题切换
      const d = document.getElementById('diff')
      if (d != null) {
        if (isDark) {
          d.className = 'vue-diff-wrapper vue-diff-mode-split vue-diff-theme-light'
        } else {
          d.className = 'vue-diff-wrapper vue-diff-mode-split vue-diff-theme-dark'
        }
      }
    })

    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath
        },
        {
          duration: 500,
          easing: 'ease-in',
          pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
        }
      )
    })
  }, 600)
  
}
</script>

<style>

.flex-grow {
  flex-grow: 1;
}

.el-menu-demo {
  padding-left: 5%;
  padding-right: 5%;
  backdrop-filter: saturate(50%) blur(4px);
  background-size: 4px 4px;
  background-image: radial-gradient(transparent 1px,var(--ep-bg-color) 1px);
  background-color: transparent;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* 进入dark模式和退出dark模式时，两个图像的位置顺序正好相反 */
.dark::view-transition-old(root) {
  z-index: 1;
}

.dark::view-transition-new(root) {
  z-index: 999;
}

::view-transition-old(root) {
  z-index: 999;
}

::view-transition-new(root) {
  z-index: 1;
}

.ep-menu--popup {
  min-width: 120px;
}

.s-icon {
  padding: 5px;
}

.si {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
}

/* switch settings 👇 */
.toggle {
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  line-height: 1;
}

.input {
  display: none;
}

.icon {
  grid-column: 1 / 1;
  grid-row: 1 / 1;
  transition: transform 500ms;
}

.icon--moon {
  transition-delay: 200ms;
  color: #bbb;
}

.icon--sun {
  transform: scale(0);
  color: #e3b341;
}

#switch:checked + .icon--moon {
  transform: rotate(360deg) scale(0);
}

#switch:checked ~ .icon--sun {
  transition-delay: 200ms;
  transform: scale(1) rotate(360deg);
}
/* switch settings 👆 */
</style>
