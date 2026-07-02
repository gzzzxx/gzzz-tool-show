<!--
  encryptionDetail.vue — algorithm-agnostic encrypt / decrypt body.

  Receives `algorithm` ('SM4' | 'AES') from the parent tab page and
  dispatches to sm4Encrypt / sm4Decrypt / aesEncrypt / aesDecrypt on
  click. Layout:

    .enc-grid       → 3fr 1fr (the original el-col 18:6 ratio, just
                       expressed as a CSS grid). Stacks to 1fr ≤992px
                       to match the original mobile behavior.
    .enc-card--main  → left card holds plaintext + key + IV + result
    .enc-card--config→ right card holds the 4 config selects + 4 action
                       buttons, full-width inside the narrow column.
    .enc-info        → two info cards below the grid (algorithm intro
                       + concepts).

  Behavior preserved verbatim from the original:
    - 3:1 column ratio + ≤992px stack
    - run() dispatches by props.algorithm (defaults to SM4 if missing)
    - copyData / clear semantics identical
    - error / success toast messages on encrypt/decrypt/copy

  Style change only: el-form-item chrome replaced with custom
  .enc-field labels (cleaner, matches the rest of the app), the two
  columns wrapped in card frames, info cards moved from el-card to
  the project's standard card chrome.

  Element Plus internal selectors use the `ep-` prefix because
  <el-config-provider namespace="ep"> (App.vue) rewrites el-* at
  runtime — same convention used everywhere else in the project.
-->
<template>
  <div class="enc-detail">
    <!-- ============== Form (3fr 1fr, stack ≤992px) ============== -->
    <div class="enc-grid">
      <!-- ===== Left card: content + key + IV + result ===== -->
      <section class="enc-card enc-card--main">
        <header class="enc-card__header">
          <span class="enc-card__title">
            {{ t('encryptionPage.section.content') }}
          </span>
        </header>
        <div class="enc-card__body">
          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.data') }}
            </label>
            <el-input
              v-model="form.data"
              type="textarea"
              :rows="6"
              resize="none"
              spellcheck="false"
              :placeholder="t('encryptionPage.placeholder.data')"
              class="enc-field__textarea"
            />
          </div>

          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.key') }}
            </label>
            <el-input
              v-model="form.key"
              :placeholder="t('encryptionPage.placeholder.key')"
            />
          </div>

          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.iv') }}
            </label>
            <el-input
              v-model="form.iv"
              :placeholder="t('encryptionPage.placeholder.iv')"
            />
          </div>

          <div class="enc-field enc-field--last">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.result') }}
            </label>
            <el-input
              v-model="form.result"
              type="textarea"
              :rows="6"
              resize="none"
              spellcheck="false"
              disabled
              :placeholder="t('encryptionPage.placeholder.result')"
              class="enc-field__textarea"
            />
          </div>
        </div>
      </section>

      <!-- ===== Right card: 4 config selects + 4 buttons ===== -->
      <section class="enc-card enc-card--config">
        <header class="enc-card__header">
          <span class="enc-card__title">
            {{ t('encryptionPage.section.config') }}
          </span>
        </header>
        <div class="enc-card__body">
          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.dataType') }}
            </label>
            <el-select v-model="form.dataType">
              <el-option
                :label="t('encryptionPage.option.textDecodedAsBase64')"
                value="TEXT"
              />
              <el-option
                :label="t('encryptionPage.option.base64')"
                value="BASE64"
              />
              <el-option
                :label="t('encryptionPage.option.hex')"
                value="HEX"
              />
            </el-select>
          </div>

          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.resultType') }}
            </label>
            <el-select v-model="form.resultType">
              <el-option
                :label="t('encryptionPage.option.textEncryptedAsBase64')"
                value="TEXT"
              />
              <el-option
                :label="t('encryptionPage.option.base64')"
                value="BASE64"
              />
              <el-option
                :label="t('encryptionPage.option.hex')"
                value="HEX"
              />
            </el-select>
          </div>

          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.keyType') }}
            </label>
            <el-select v-model="form.keyType">
              <el-option
                :label="t('encryptionPage.option.base64')"
                value="BASE64"
              />
              <el-option
                :label="t('encryptionPage.option.hex')"
                value="HEX"
              />
            </el-select>
          </div>

          <div class="enc-field">
            <label class="enc-field__label">
              {{ t('encryptionPage.field.mode') }}
            </label>
            <el-select v-model="form.mode">
              <el-option
                :label="t('encryptionPage.option.ecb')"
                value="ECB"
              />
              <el-option
                :label="t('encryptionPage.option.cbc')"
                value="CBC"
              />
              <el-option
                :label="t('encryptionPage.option.ctr')"
                value="CTR"
              />
            </el-select>
          </div>

          <div class="enc-buttons">
            <el-button
              type="success"
              class="enc-buttons__btn"
              @click="run('enc')"
            >
              {{ t('encryptionPage.action.encrypt') }}
            </el-button>
            <el-button
              type="info"
              class="enc-buttons__btn"
              @click="run('dec')"
            >
              {{ t('encryptionPage.action.decrypt') }}
            </el-button>
            <el-button class="enc-buttons__btn" @click="copyData">
              {{ t('encryptionPage.action.copy') }}
            </el-button>
            <el-button
              class="enc-buttons__btn enc-buttons__btn--last"
              @click="clear"
            >
              {{ t('encryptionPage.action.clear') }}
            </el-button>
          </div>
        </div>
      </section>
    </div>

    <!-- ============== Info cards ============== -->
    <section class="enc-info">
      <div class="enc-info__card">
        <header class="enc-info__header">
          <span class="enc-info__title">
            {{ t('encryptionPage.section.algorithmIntro') }}
          </span>
        </header>
        <div class="enc-info__body">
          <p class="enc-info__para">
            <strong>{{ props.algorithm }}.0</strong>
            <span>（原名SMS4.0）是一种</span>
            <span class="enc-info__term">分组密码</span>
            <span>标准，由</span>
            <span class="enc-info__term">国家密码管理局</span>
            <span>于2012年3月21日发布。相关标准为"GM/T 0002-2012《SM4分组密码算法》（原SMS4分组密码算法）"。</span>
          </p>
          <p class="enc-info__para">
            <span>在</span>
            <span class="enc-info__term">商用密码</span>
            <span>体系中，SM4主要用于</span>
            <span class="enc-info__term">数据加密</span>
            <span>，其算法公开，分组长度与密钥长度均为128bit，</span>
            <span class="enc-info__term">加密算法</span>
            <span>与密钥扩展算法都采用32轮非线性迭代结构，</span>
            <span class="enc-info__term">S盒</span>
            <span>为固定的8比特输入8比特输出。</span>
          </p>
          <p class="enc-info__para">
            SM4.0中的指令长度被提升到大于64K（即64×1024）的水平，这是SM 3.0规格（渲染指令长度允许大于512）的128倍。
          </p>
        </div>
      </div>

      <div class="enc-info__card">
        <header class="enc-info__header">
          <span class="enc-info__title">
            {{ t('encryptionPage.section.concept') }}
          </span>
        </header>
        <div class="enc-info__body">
          <p class="enc-info__para">
            <span>在</span>
            <span class="enc-info__term">密码学</span>
            <span>中，</span>
            <strong>分组加密</strong>
            <span>（英语：</span>
            <strong>Block cipher</strong>
            <span>），又称</span>
            <strong>分块加密</strong>
            <span>或</span>
            <strong>块密码</strong>
            <span>，是一种对称密钥算法。它将明文分成多个等长的模块（block），使用确定的算法和</span>
            <span class="enc-info__term">对称密钥</span>
            <span>对每组分别加密解密。分组加密是极其重要的加密协议组成，其中典型的如</span>
            <span class="enc-info__term">DES</span>
            <span>和</span>
            <span class="enc-info__term">AES</span>
            <span>作为美国政府核定的标准加密算法，应用领域从电子邮件加密到银行交易转帐，非常广泛。</span>
          </p>
          <p class="enc-info__para">
            国密即国家密码局认定的国产密码算法。主要有SM1，SM2，SM3，SM4。密钥长度和分组长度均为128位。
          </p>
          <p class="enc-info__para">
            SM1为对称加密。其加密强度与AES相当。该算法不公开，调用该算法时，需要通过加密芯片的接口进行调用。
          </p>
          <p class="enc-info__para">
            SM2为非对称加密，基于ECC。该算法已公开。由于该算法基于ECC，故其签名速度与秘钥生成速度都快于RSA。ECC 256位（SM2采用的就是ECC 256位的一种）安全强度比RSA 2048位高，但运算速度快于RSA。
          </p>
          <p class="enc-info__para">
            SM3消息摘要。可以用MD5作为对比理解。该算法已公开。校验结果为256位。
          </p>
          <p class="enc-info__para">
            SM4无线局域网标准的分组数据算法。对称加密，密钥长度和分组长度均为128位。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  sm4Encrypt,
  sm4Decrypt,
  aesEncrypt,
  aesDecrypt,
} from '~/utils/crypto'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps<{ algorithm: string }>()

const form = reactive({
  algorithmName: 'SM4' as 'SM4' | 'AES',
  data: '',
  key: '',
  iv: '',
  result: '',
  dataType: 'TEXT' as 'TEXT' | 'BASE64' | 'HEX',
  resultType: 'TEXT' as 'TEXT' | 'BASE64' | 'HEX',
  keyType: 'BASE64' as 'TEXT' | 'BASE64' | 'HEX',
  mode: 'ECB' as 'ECB' | 'CBC' | 'CTR',
})

/** 同步跑加解密（纯前端，旧的 /sm4/* 后端接口已不再调用） */
function run(op: 'enc' | 'dec') {
  form.algorithmName = (props.algorithm as 'SM4' | 'AES') ?? 'SM4'
  try {
    const fn = form.algorithmName === 'AES'
      ? (op === 'enc' ? aesEncrypt : aesDecrypt)
      : (op === 'enc' ? sm4Encrypt : sm4Decrypt)
    form.result = fn({ ...form })
    ElMessage.success({
      message: op === 'enc'
        ? t('encryptionPage.message.encryptSuccess')
        : t('encryptionPage.message.decryptSuccess'),
    })
  } catch (e: unknown) {
    ElMessage.error({
      message: e instanceof Error ? e.message : t('encryptionPage.message.error'),
    })
  }
}

function copyData() {
  navigator.clipboard.writeText(form.result).then(
    () => ElMessage.success({ message: t('encryptionPage.message.copySuccess') }),
    () => ElMessage.error({ message: t('encryptionPage.message.copyFailed') }),
  )
}

function clear() {
  form.data = ''
  form.key = ''
  form.iv = ''
  form.result = ''
}
</script>

<style lang="scss" scoped>
/* ====================================================================
   Form layout — 3:1 grid matching the original el-col 18:6 ratio.
   Below 992px the columns stack full-width (the original mobile
   breakpoint); the rowGutter behavior the old implementation did
   with useMediaQuery collapses cleanly into the grid `gap`.
   ==================================================================== */
.enc-grid {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 16px;
  align-items: stretch;
}
@media (max-width: 991.98px) {
  .enc-grid {
    grid-template-columns: 1fr;
  }
}

/* Card + header — same chrome family as sql-card / xml-card /
   c-card / base64-card. Plain section (not el-card) so we keep
   full control over border + radius. */
.enc-card {
  display: flex;
  flex-direction: column;
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}
.enc-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.enc-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.enc-card__body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ====================================================================
   Field — replaces el-form-item. Custom label above the control so
   it matches the rest of the app (no floating label / no required-
   asterisk overhead). The textarea variant grows to fill remaining
   space inside its card; key/IV inputs are single-line.
   ==================================================================== */
.enc-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.enc-field--last {
  /* Replaces the original "margin-bottom:0 !important" on the last
     el-form-item. The result textarea is the last input, no extra
     bottom margin needed. */
  margin-bottom: 0;
}
.enc-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.enc-field__textarea :deep(textarea) {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
}

/* ====================================================================
   Buttons — full-width stacked inside the narrow config card.
   4 buttons with 10px gap, last one keeps the same gap below (no
   extra trailing margin). The .enc-buttons__btn--last flag is
   load-bearing only to preserve the original's `margin-bottom:0`
   on the Clear button.
   ==================================================================== */
.enc-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}
.enc-buttons__btn {
  width: 100%;
  margin-left: 0 !important;
}
.enc-buttons__btn--last {
  margin-bottom: 0 !important;
}

/* ====================================================================
   Info cards — full-width strips below the form grid. Same chrome
   as .enc-card; the body uses the same typography pattern as
   base64.vue's reference card.
   ==================================================================== */
.enc-info {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.enc-info__card {
  background-color: var(--it-bg-elevated);
  border: 1px solid var(--it-border);
  border-radius: 4px;
  overflow: hidden;
}
.enc-info__header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--it-border);
  background-color: var(--it-bg-elevated);
}
.enc-info__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--it-text-primary);
}
.enc-info__body {
  padding: 16px 20px 20px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--it-text-primary);
}
.enc-info__para {
  margin: 0 0 12px;
}
.enc-info__para:last-child {
  margin-bottom: 0;
}
.enc-info__term {
  color: var(--brand-primary);
  font-weight: 600;
}

/* ====================================================================
   Element Plus internal tweaks — ep-* prefix because of
   <el-config-provider namespace="ep">. Select inside any field
   fills the field width (the original scoped this on
   .ep-form-item__content .ep-select; we apply it at field level).
   ==================================================================== */
:deep(.enc-field .ep-select) {
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

@media (max-width: 600px) {
  .enc-info__body { padding: 12px 14px 16px; }
  .enc-card__header { padding: 10px 12px; }
  .enc-card__body { padding: 14px 16px 16px; }
}
</style>