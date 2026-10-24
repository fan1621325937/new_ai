<script setup lang="ts">
import type { AppTableColumn, PrintConfig } from './types'
import { reactive } from 'vue'
import PrintPageFont from './PrintPageFont.vue'

/** 打印设置表单体：页面/字体 + 打印列 + 签名栏 */
defineOptions({
  name: 'AppTablePrintForm',
})

const props = defineProps<{
  config: PrintConfig
  /** 可打印列（勾选值用 prop，避免同名列冲突） */
  columns: AppTableColumn[]
}>()

const newSign = reactive({ value: '', inputting: false })

function addSign(config: PrintConfig): void {
  const raw = newSign.value.trim()
  if (!raw)
    return
  const colon = String.fromCharCode(0xFF1A)
  const text = raw.endsWith(colon) || raw.endsWith(':') ? raw : `${raw}${colon}`
  if (!config.signatures.includes(text))
    config.signatures.push(text)
  newSign.value = ''
  newSign.inputting = false
}

function selectAll(): void {
  props.config.checkList = props.columns.map(c => c.prop!).filter(Boolean)
}
</script>

<template>
  <div class="print-set">
    <PrintPageFont :config="config" />

    <section class="print-set__card">
      <header class="print-set__card-hd">
        <i class="print-set__dot" />
        打印列
        <span class="print-set__card-extra">
          <el-button size="small" text type="primary" @click="selectAll">全选</el-button>
          <el-button size="small" text @click="config.checkList = []">清空</el-button>
        </span>
      </header>
      <el-checkbox-group v-model="config.checkList" class="print-set__checks">
        <el-checkbox v-for="col in columns" :key="col.prop" :value="col.prop" border size="small">
          {{ col.label }}
        </el-checkbox>
      </el-checkbox-group>
    </section>

    <section class="print-set__card">
      <header class="print-set__card-hd">
        <i class="print-set__dot" />
        签名栏
        <span class="print-set__card-extra">打印在表格右下方，可多项</span>
      </header>
      <div class="print-set__signs">
        <el-tag
          v-for="(s, i) in config.signatures"
          :key="s"
          closable
          size="large"
          @close="config.signatures.splice(i, 1)"
        >
          {{ s }}
        </el-tag>
        <el-input
          v-if="newSign.inputting"
          v-model="newSign.value"
          size="small"
          class="print-set__sign-input"
          placeholder="如：审核人，回车确认"
          @keyup.enter="addSign(config)"
          @blur="addSign(config)"
        />
        <el-button v-else size="small" @click="newSign.inputting = true">
          + 添加签名
        </el-button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" src="./print-settings.scss"></style>
