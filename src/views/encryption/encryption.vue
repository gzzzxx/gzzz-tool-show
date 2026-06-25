<template>
  <div style="padding: 0px 21% 0px 21%;">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="SM4" name="SM4">
        <detail :algorithm="algorithm"/>
      </el-tab-pane>
      <el-tab-pane label="AES" name="AES">
        <detail :algorithm="algorithm"/>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import detail from './encryptionDetail.vue'

// algorithm 由路由 props 传入（registry 里 SM4 / AES 各传一份），
// 不再从 route.params 读，避开 alias 模式下两个 path 共享一条
// :id 路由带来的 params 解析问题。
const props = defineProps<{ algorithm: string }>()

const activeName = ref(props.algorithm)
let algorithm = props.algorithm

const handleClick = (tab: any) => {
    algorithm = tab.props.label
}
</script>

<style lang="less" scoped>

// :deep(.ep-tabs__nav-scroll) {
// 	width:50%;
// 	margin:0 auto
// }

</style>