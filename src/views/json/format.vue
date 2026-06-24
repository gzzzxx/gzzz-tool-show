<script lang="ts" setup>

import { ref, computed } from 'vue';
import JsonPreview from '../../components/json/JsonPreview.vue';
import JsonEditorVue from 'json-editor-vue'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import './home-page.scss'
import { useIsDark } from '../../composables/useIsDark'

const text = ref('');

const isDark = useIsDark()

// vanilla-jsoneditor ships its dark theme via the .jse-theme-dark root
// class; the light theme is the default (no extra class / css needed).
const editorClass = computed(() =>
  isDark.value ? 'my-json-editor jse-theme-dark' : 'my-json-editor',
)

const strings = ref({
  en: {
    title: 'JSON Format',
    copy: 'Copy',
    reduce: 'Reduce',
    format: 'Format',
  },
  cn: {
    title: 'JSON 格式化',
    copy: '复制',
    reduce: '压缩',
    format: '格式化',
  },
});

const local = computed(() => {
  if (navigator.language.startsWith('zh')) {
    return strings.value.cn;
  }
  return strings.value.en;
});

function minJson() {
  const obj = JSON.parse(text.value);
  if (obj !== undefined) {
    text.value = JSON.stringify(obj);
  }
}

function formatJson() {
  const obj = JSON.parse(text.value);
  if (obj !== undefined) {
    text.value = JSON.stringify(obj, null, '  ');
  }
}

function copyJson() {
  navigator.clipboard.writeText(text.value);
}

</script>
<template>
  <div class="editor">
    <div class="main">
      <div
        class="json-editor"
      >
        <!-- <div class="tool-bar">
          <el-button @click="minJson">
            {{ local.reduce }}
          </el-button>
          <el-button @click="formatJson">
            {{ local.format }}
          </el-button>
          <el-button @click="copyJson">
            {{ local.copy }}
          </el-button>
        </div> -->
        <textarea
          placeholder="请输入json数据 ..."
          v-model="text"
        />
      </div>
      <div>
        <!-- <JsonPreview
          :json="text"
          class="json-preview"
        /> -->
        <JsonEditorVue
          id="JsonEditorVue"
          :class="editorClass"
          mode="text"
          v-model="text"
          v-bind="{/* local props & attrs */}"
          :mainMenuBar="true"
          :navigationBar="true"
          :readOnly="true"
          :askToFormat="false"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>

</style>
