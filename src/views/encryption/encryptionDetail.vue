<template>
  <el-form :model="form" label-position="top">
    <el-row :gutter="rowGutter" justify="center">
      <el-col :xs="24" :sm="24" :md="18" :lg="18" :xl="18">
        <el-form-item label="加密/解密内容">
          <el-input v-model="form.data" placeholder="加密/解密内容" type="textarea" :rows="6" resize='none'></el-input>
        </el-form-item>
        <el-form-item label="密钥">
          <el-input v-model="form.key" placeholder="密钥"></el-input>
        </el-form-item>
        <el-form-item label="向量IV">
          <el-input v-model="form.iv" placeholder="向量IV"></el-input>
        </el-form-item>
        <el-form-item label="加密/解密结果" style="margin-bottom:0 !important;">
          <el-input v-model="form.result" placeholder="加密/解密结果" disabled type="textarea" :rows="6" resize='none'></el-input>
        </el-form-item>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
        <el-form-item label="加密/解密内容数据格式">
          <el-select v-model="form.dataType">
            <el-option label="文本（解密为Base64）" value="TEXT" />
            <el-option label="Base64" value="BASE64" />
            <el-option label="十六进制" value="HEX" />
          </el-select>
        </el-form-item>
        <el-form-item label="加密/解密结果数据格式">
          <el-select v-model="form.resultType">
            <el-option label="文本（加密为Base64）" value="TEXT" />
            <el-option label="Base64" value="BASE64" />
            <el-option label="十六进制" value="HEX" />
          </el-select>
        </el-form-item>
        <el-form-item label="密钥/IV数据格式">
          <el-select v-model="form.keyType">
            <el-option label="Base64" value="BASE64" />
            <el-option label="十六进制" value="HEX" />
          </el-select>
        </el-form-item>
        <el-form-item label="加密模式">
          <el-select v-model="form.mode">
            <el-option label="ECB" value="ECB" />
            <el-option label="CBC" value="CBC" />
            <el-option label="CTR" value="CTR" />
          </el-select>
        </el-form-item>
        <el-button type="success" class="bu" @click="run('enc')">加密</el-button>
        <el-button type="info" class="bu" @click="run('dec')">解密</el-button>
        <el-button class="bu" @click="copyData()">复制结果</el-button>
        <el-button class="bu" @click="clear()" style="margin-bottom:0 !important;">清空</el-button>
      </el-col>
    </el-row>
    <el-row style="margin:20px 0 0px 0px;text-align: left;">
      <el-col :span="24">
        <el-card class="box-card">
          <el-text tag="b">算法介绍</el-text>
          <br/>
          <el-text class="text_left">
            <el-text tag="b">SM4.0</el-text>
            （原名SMS4.0）是一种
            <el-text type="primary">分组密码</el-text>
            标准，由
            <el-text type="primary">国家密码管理局</el-text>
            于2012年3月21日发布。相关标准为“GM/T 0002-2012《SM4分组密码算法》（原SMS4分组密码算法）”。
          </el-text>
          <br/>
          <el-text class="text_left">
            在
            <el-text type="primary">商用密码</el-text>
            体系中，SM4主要用于
            <el-text type="primary">数据加密</el-text>
            ，其算法公开，分组长度与密钥长度均为128bit，
            <el-text type="primary">加密算法</el-text>
            与密钥扩展算法都采用32轮非线性迭代结构，
            <el-text type="primary">S盒</el-text>
            为固定的8比特输入8比特输出。
          </el-text>
          <br/>
          <el-text class="text_left">SM4.0中的指令长度被提升到大于64K（即64×1024）的水平，这是SM 3.0规格（渲染指令长度允许大于512）的128倍。</el-text>
        </el-card>
      </el-col>
    </el-row>
    <el-row style="margin:20px 0 20px 0px;text-align: left;">
      <el-col :span="24">
        <el-card class="box-card">
          <el-text tag="b">相关概念</el-text>
          <br/>
          <el-text class="text_left">
            在
            <el-text type="primary">密码学</el-text>
            中，
            <el-text tag="b">分组加密</el-text>
            （英语：
            <el-text tag="b">Block cipher</el-text>
            ），又称
            <el-text tag="b">分块加密</el-text>
            或
            <el-text tag="b">块密码</el-text>
            ，是一种对称密钥算法。它将明文分成多个等长的模块（block），使用确定的算法和
            <el-text type="primary">对称密钥</el-text>
            对每组分别加密解密。分组加密是极其重要的加密协议组成，其中典型的如
            <el-text type="primary">DES</el-text>
            和
            <el-text type="primary">AES</el-text>
            作为美国政府核定的标准加密算法，应用领域从电子邮件加密到银行交易转帐，非常广泛。
          </el-text>
          <br/>
          <el-text class="text_left">国密即国家密码局认定的国产密码算法。主要有SM1，SM2，SM3，SM4。密钥长度和分组长度均为128位。</el-text>
          <br/>
          <el-text class="text_left">SM1为对称加密。其加密强度与AES相当。该算法不公开，调用该算法时，需要通过加密芯片的接口进行调用。</el-text>
          <br/>
          <el-text class="text_left">SM2为非对称加密，基于ECC。该算法已公开。由于该算法基于ECC，故其签名速度与秘钥生成速度都快于RSA。ECC 256位（SM2采用的就是ECC 256位的一种）安全强度比RSA 2048位高，但运算速度快于RSA。</el-text>
          <br/>
          <el-text class="text_left">SM3消息摘要。可以用MD5作为对比理解。该算法已公开。校验结果为256位。</el-text>
          <br/>
          <el-text class="text_left">SM4无线局域网标准的分组数据算法。对称加密，密钥长度和分组长度均为128位。</el-text>
          <br/>
        </el-card>
      </el-col>
    </el-row>
  </el-form>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { sm4Encrypt, sm4Decrypt, aesEncrypt, aesDecrypt, type CipherParams } from '../../utils/crypto';

const form = reactive({
  algorithmName: 'SM4' as 'SM4' | 'AES',
  data: '',
  key: '',
  iv: '',
  result: '',
  dataType: 'TEXT' as 'TEXT' | 'BASE64' | 'HEX',
  resultType: 'TEXT' as 'TEXT' | 'BASE64' | 'HEX',
  keyType: 'BASE64' as 'TEXT' | 'BASE64' | 'HEX',
  mode: 'ECB' as 'ECB' | 'CBC' | 'CTR'
})

const props = defineProps<{ algorithm: string }>()

/** 同步跑加解密（纯前端，旧的 /sm4/* 后端接口已不再调用） */
function run(op: 'enc' | 'dec') {
  form.algorithmName = (props.algorithm as 'SM4' | 'AES') ?? 'SM4'
  try {
    const fn = form.algorithmName === 'AES'
      ? (op === 'enc' ? aesEncrypt : aesDecrypt)
      : (op === 'enc' ? sm4Encrypt : sm4Decrypt)
    form.result = fn({ ...form })
    ElMessage.success({ message: op === 'enc' ? '加密成功' : '解密成功' })
  } catch (e: any) {
    ElMessage.error({ message: e?.message ?? '处理失败' })
  }
}

function copyData() {
  navigator.clipboard.writeText(form.result).then(() => {
    ElMessage.success({message: '复制成功'})
  })
}

function clear() {
  form.data = ''
  form.key = ''
  form.iv = ''
  form.result = ''
}

// 窄屏把 el-row 的 gutter 从 30 收到 10：col 全宽堆叠时两侧各 15px
// padding 太松散，会让 form 在 ~360px 屏宽下显得空旷。
const isCompactGutter = useMediaQuery('(max-width: 991.98px)')
const rowGutter = computed(() => isCompactGutter.value ? 10 : 30)
</script>

<style lang="less" scoped>
.bu {
  width: 100%;
  margin-top: 14px !important;
  margin-left: 0 !important;
}

.text_left {
  margin-left: 28px;
}

:deep(.ep-form-item__content .ep-select) {
  width: 100% !important;
}

:deep(.ep-textarea__inner::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
:deep(.ep-textarea__inner::-webkit-scrollbar-thumb) {
  border-radius: 3px;
  background-color: #c3c3c3;
}
:deep(.ep-textarea__inner::-webkit-scrollbar-track) {
  background-color: transparent;
}
:deep(.ep-text) {
  line-height: 24px;
}

/* Mobile tweaks — desktop (≥992px) keeps the original layout untouched.
   Below 992px the two columns stack full-width (controlled by the
   :xs/:sm/:md props on el-col and the rowGutter computed), so we
   tighten:
   - 28px left indent for prose is too wide on phones (text wraps to one
     short word per line)
   - card body padding: default 20px eats too much of a 360px viewport
   - form-item bottom margin: EP default 22px is fine on desktop, but
     stacked vertically the form feels airy, so we keep it tight */
@media (max-width: 767.98px) {
  .text_left {
    margin-left: 12px;
  }
  :deep(.ep-card__body) {
    padding: 14px;
  }
  :deep(.ep-form-item) {
    margin-bottom: 16px;
  }
}
</style>

