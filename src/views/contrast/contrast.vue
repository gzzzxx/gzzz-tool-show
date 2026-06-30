<template>
  <el-form :model="form">
    <el-row :gutter="rowGutter" style="margin-left: 20px">
      <el-col :xs="24" :sm="8" :md="3" :lg="3" :xl="3">
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 120px">
            <el-option label="css" value="css" />
            <el-option label="xml" value="xml" />
            <el-option label="markdown" value="markdown" />
            <el-option label="javascript" value="javascript" />
            <el-option label="json" value="json" />
            <el-option label="plaintext" value="plaintext" />
            <el-option label="typescript" value="typescript" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="8" :md="3" :lg="3" :xl="3">
        <el-form-item label="模式">
          <el-select v-model="form.mode" style="width: 120px">
            <el-option label="split" value="split" />
            <el-option label="unified" value="unified" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="8" :md="3" :lg="3" :xl="3">
        <el-form-item>
          <el-tooltip placement="top" content="折叠未更改区域">
            <el-switch v-model="form.folding" />
          </el-tooltip>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <el-row :gutter="rowGutter" style="margin: 0px 10px 0px 10px">
    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
      <el-input v-model="form.prev" placeholder="待对比 ..." type="textarea" :rows="8" resize='none'></el-input>
    </el-col>
    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
      <el-input v-model="form.current" placeholder="当前的 ..." type="textarea" :rows="8" resize='none'></el-input>
    </el-col>
  </el-row>
  <el-row style="margin: 1rem 20px 0px 20px">
    <Diff
      id="diff"
      :mode="form.mode"
      :theme="theme"
      :language="form.type"
      :prev="form.prev"
      :current="form.current"
      :folding="form.folding"
    />
  </el-row>
</template>

<script lang="ts" setup>
import { reactive, computed, watch, nextTick } from "vue";
import { useMediaQuery } from '@vueuse/core';
import { useIsDark } from '../../composables/useIsDark'

const isDark = useIsDark()

// Theme follows the site-wide toggle. vue-diff applies its colors via the
// vue-diff-theme-{dark|light} class on the wrapper, so we keep that in sync
// here too — the prop alone doesn't repaint when the user toggles later.
const theme = computed(() => (isDark.value ? 'dark' : 'light'))

const form = reactive({
  type: "javascript",
  mode: "split",
  prev: "",
  current: "",
  folding: false,
});

watch(
  [isDark, () => form.mode],
  ([dark, mode]) => {
    nextTick(() => {
      const d = document.getElementById('diff')
      if (d) {
        d.className = `vue-diff-wrapper vue-diff-mode-${mode} vue-diff-theme-${dark ? 'dark' : 'light'}`
      }
    })
  },
  { immediate: true, flush: 'post' },
)

// 窄屏 (<992px) 把 gutter 从 20 收到 10：两栏堆叠后两侧各 10px padding
// 已经是无意义的水平留白，反而让 textarea 在 ~360px 屏宽下显得窄。
const isCompactGutter = useMediaQuery('(max-width: 991.98px)')
const rowGutter = computed(() => isCompactGutter.value ? 10 : 20)
</script>

<style lang="scss" scoped>
.vue-diff-theme-custom {
  @import "highlight.js/scss/vs2015.scss"; // import theme

  background-color: #000; // Set background color
}

/* Mobile — desktop (≥992px) keeps the original 20px outer margins intact.
   Below 992px the cols stack full-width so the 20px side padding eats a
   lot of a 360px viewport; drop to 8px. Also loosen the diff row's 20px
   horizontal margin since the diff panel itself doesn't need it. */
@media (max-width: 991.98px) {
  :deep(.el-row) {
    margin-left: 8px !important;
    margin-right: 8px !important;
  }
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
