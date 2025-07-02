<template>
  <div class="timestamp-tool">
    <h2 class="title">时间戳转换工具</h2>
    <div class="subtitle">支持秒/毫秒与日期互转，选择或输入任意一项自动同步</div>
    <el-card class="input-card">
      <el-row :gutter="20" style="margin-bottom: 16px;">
        <el-col :span="24">
          <div class="date-picker-wrapper">
            <el-date-picker
              v-model="datePickerValue"
              type="datetime"
              placeholder="选择日期时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%; max-width: 300px;"
              @change="onDatePickerChange"
              clearable
              class="custom-date-picker"
            />
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <el-input
            v-model="timestamp"
            placeholder="请输入时间戳（秒或毫秒）"
            @input="onTimestampInput"
            prefix-icon="el-icon-time"
            clearable
          />
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="dateString"
            placeholder="请输入日期（YYYY-MM-DD HH:mm:ss）"
            @input="onDateInput"
            prefix-icon="el-icon-date"
            clearable
          />
        </el-col>
      </el-row>
    </el-card>
    <el-row :gutter="20" class="result-row">
      <el-col :span="12">
        <el-card class="result-card">
          <div class="result-label">对应日期</div>
          <div class="result-row-flex">
            <span class="result-value">{{ formattedDate }}</span>
            <el-button
              v-if="formattedDate"
              type="primary"
              size="small"
              :icon="DocumentCopy"
              @click="copyToClipboard(formattedDate)"
              class="copy-btn"
              circle
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="result-card">
          <div class="result-label">对应时间戳</div>
          <div class="result-row-flex">
            <span class="result-value">{{ formattedTimestamp }}</span>
            <el-button
              v-if="formattedTimestamp"
              type="primary"
              size="small"
              :icon="DocumentCopy"
              @click="copyToClipboard(formattedTimestamp)"
              class="copy-btn"
              circle
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';

const timestamp = ref('');
const dateString = ref('');
const formattedDate = ref('');
const formattedTimestamp = ref('');
const datePickerValue = ref<string | null>(null);

function pad(num: number) {
  return num < 10 ? '0' + num : num;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function onTimestampInput() {
  let ts = timestamp.value.trim();
  if (!ts) {
    formattedDate.value = '';
    return;
  }
  // 支持秒和毫秒
  if (ts.length === 10) ts = ts + '000';
  const num = Number(ts);
  if (!isNaN(num)) {
    const date = new Date(num);
    if (!isNaN(date.getTime())) {
      formattedDate.value = formatDate(date);
      dateString.value = formatDate(date);
      datePickerValue.value = formatDate(date);
    } else {
      formattedDate.value = '无效时间戳';
    }
  } else {
    formattedDate.value = '无效时间戳';
  }
}

function onDateInput() {
  const str = dateString.value.trim();
  if (!str) {
    formattedTimestamp.value = '';
    formattedDate.value = '';
    return;
  }
  const date = new Date(str.replace(/-/g, '/'));
  if (!isNaN(date.getTime())) {
    formattedTimestamp.value = date.getTime().toString();
    timestamp.value = date.getTime().toString();
    datePickerValue.value = str;
    formattedDate.value = formatDate(date);
  } else {
    formattedTimestamp.value = '无效日期';
    formattedDate.value = '';
  }
}

function onDatePickerChange(val: string) {
  if (val) {
    dateString.value = val;
    onDateInput();
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      ElMessage.success('已复制到剪贴板');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
}
</script>

<style scoped>
.timestamp-tool {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px 12px;
  background: var(--ep-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}
.subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 24px;
  font-size: 1rem;
}
.input-card {
  margin-bottom: 24px;
  border-radius: 8px;
}
.result-row {
  margin-top: 12px;
}
.result-card {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  border-radius: 8px;
  background: var(--ep-fill-color-light);
}
.result-label {
  color: var(--ep-text-color-secondary);
  font-size: 0.95rem;
  margin-bottom: 8px;
}
.result-row-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  gap: 8px;
}
.result-value {
  flex: 1;
  font-size: 1.15rem;
  font-weight: bold;
  color: var(--ep-text-color-primary);
  word-break: break-all;
  padding-right: 4px;
}
.copy-btn {
  margin-left: 0;
  border-radius: 50%;
  padding: 4px;
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  background: var(--ep-fill-color-blank);
  border: none;
}
.copy-btn:hover {
  background: var(--ep-color-primary-light-9);
  color: var(--ep-color-primary);
}
@media (max-width: 600px) {
  .timestamp-tool {
    padding: 8px 2px;
  }
  .result-card {
    min-height: 80px;
  }
}
.date-picker-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
</style> 