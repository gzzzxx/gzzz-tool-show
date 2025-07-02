<template>

  <!-- <img
    src="../images/home-page.png"
    alt="banner"
    class="mobile-banner"
    style="width: 600px;margin-top: 20px;"
  /> -->

  <div class="inner">
    <h1>程序开发常用工具</h1>
    <p>SM4加解密 / AES加解密 / JSON格式化 / Base64转换 / 代码对比 ...</p>
    <span>如果对您有帮助，请将其分享给您的朋友，给我们 </span><span color="#e3b341">⭐ Star</span> 。<span>感谢您的支持！</span>
    <p align="center">
      <a href="https://github.com/gzzzxx/gzzz-tool-show"><img src="https://img.shields.io/badge/GitHub-gzzzxx-blue?logo=github" /></a>
      <a style="padding-left: 10px;" href="https://gitee.com/gzzzxx/gzzz-tool-show"><img src="https://img.shields.io/badge/Gitee-gzzzxx-yellow?logo=gitee&logoColor=rgb(199, 29, 35)" /></a>
    </p>
    <el-row style="padding-left: 30px;padding-right: 30px;">
      <el-divider />
    </el-row>
    <div type="flex" align="middle">
      <el-row style="width: 60%">
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/encryption/SM4')">SM4加解密</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/encryption/AES')">AES加解密</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/format')">JSON格式化</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/base64')">Base64转换</el-button>
        </el-col>
      </el-row>
      <el-row style="width: 60%;margin-top: 20px;">
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/contrast')">代码对比</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/calendar')">日历</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" text bg @click="handleChange('/timestamp')">时间戳转换</el-button>
        </el-col>
      </el-row>
    </div>
  </div>
  
  <footer>
    <el-link style="color: #4f4f4f;" href="https://beian.miit.gov.cn/">京ICP备2023038054号</el-link>
  </footer>
  
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();

const handleChange = (_val: any) => {
  if (_val == 1) {
    router.push("/");
  } else {
    router.push(_val);
  }
};
</script>

<style>
.inner {
  min-height: calc(100vh - 120px);
  position: relative;
}
.ep-button {
  width: 80%;
}
</style>
