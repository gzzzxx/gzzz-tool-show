import { createApp } from "vue";
import App from "./App.vue";
import './axios/index.js'
import './assets/font/font.css'

import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';

import "~/styles/index.scss";
import "uno.css";
import router from './router'

// If you want to use ElMessage, import it.
import "element-plus/theme-chalk/src/message.scss";

import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const app = createApp(App);

app.use(ElementPlus, {
  locale: zhCn,
})
app.use(router);
app.use(VueDiff);
app.mount("#app");
