<script setup lang="ts">
import type { PrintConfig } from './types'
import { computed } from 'vue'
import { FONT_FAMILY_OPTIONS, FONT_SIZE_OPTIONS, PAPER_OPTIONS } from './usePrint'

/**
 * 页面参数（标题/纸张/边距 + 小图预览）+ 字体三档
 * 布局：左右两卡等宽；字体卡按内容高度，不再被页面卡拉高
 */
defineOptions({
  name: 'AppTablePrintPageFont',
})

const props = defineProps<{
  config: PrintConfig
}>()

const fontRows = [
  { key: 'title' as const, name: '标题' },
  { key: 'subTitle' as const, name: '表头' },
  { key: 'content' as const, name: '内容' },
]

const marginRows = [
  { key: 'top' as const, name: '上' },
  { key: 'bottom' as const, name: '下' },
  { key: 'left' as const, name: '左' },
  { key: 'right' as const, name: '右' },
]

const paperBoxStyle = computed(() => {
  const land = props.config.pageSet.direction === 'landscape'
  return { width: land ? '72px' : '52px', height: land ? '52px' : '72px' }
})

const paperInnerStyle = computed(() => {
  const pad = (n: number) => `${Math.min(Number(n) || 0, 3) * 5 + 3}px`
  const ps = props.config.pageSet
  return { top: pad(ps.top), bottom: pad(ps.bottom), left: pad(ps.left), right: pad(ps.right) }
})

function handlePaperChange(name: string): void {
  const paper = PAPER_OPTIONS.find(p => p.label === name)
  if (paper) {
    props.config.pageSet.size = paper.size
    props.config.pageSet.direction = paper.direction
  }
}
</script>

<template>
  <div class="print-set__top">
    <!-- 页面 -->
    <section class="print-set__card">
      <header class="print-set__card-hd">
        <i class="print-set__dot" />
        页面
      </header>

      <div class="print-set__page-row">
        <div class="print-set__field print-set__field--grow">
          <label>报表标题</label>
          <el-input v-model="config.printTitle" size="small" maxlength="40" placeholder="请输入报表名称" />
        </div>
        <div class="print-set__field print-set__field--grow">
          <label>纸张</label>
          <el-select v-model="config.pageSet.page" size="small" @change="handlePaperChange">
            <el-option v-for="o in PAPER_OPTIONS" :key="o.label" :label="o.label" :value="o.label" />
          </el-select>
        </div>
      </div>

      <div class="print-set__page-row print-set__page-row--bottom">
        <div class="print-set__paper-mini">
          <div class="print-set__paper-sheet" :style="paperBoxStyle">
            <div class="print-set__paper-margin" :style="paperInnerStyle" />
          </div>
          <span class="print-set__paper-meta">
            {{ config.pageSet.size }}{{ config.pageSet.direction === 'landscape' ? '横' : '竖' }}
          </span>
        </div>

        <div class="print-set__margins">
          <div v-for="m in marginRows" :key="m.key" class="print-set__margin-item">
            <label>{{ m.name }}</label>
            <el-input-number
              v-model="config.pageSet[m.key]"
              size="small"
              :min="0"
              :max="5"
              :step="0.5"
              :controls="false"
            />
            <span class="print-set__unit">cm</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 字体 -->
    <section class="print-set__card print-set__card--fit">
      <header class="print-set__card-hd">
        <i class="print-set__dot" />
        字体
      </header>
      <div class="print-set__font-grid">
        <div class="print-set__font-head">
          <span />
          <span>字体</span>
          <span>字号</span>
          <span>对齐</span>
        </div>
        <div v-for="row in fontRows" :key="row.key" class="print-set__font-row">
          <b>{{ row.name }}</b>
          <el-select v-model="config.fontSet[row.key].fontFamily" size="small">
            <el-option v-for="o in FONT_FAMILY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-select v-model="config.fontSet[row.key].fontSize" size="small">
            <el-option v-for="o in FONT_SIZE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-select v-model="config.fontSet[row.key].textAlign" size="small">
            <el-option label="居中" value="center" />
            <el-option label="靠左" value="left" />
            <el-option label="靠右" value="right" />
          </el-select>
        </div>
      </div>
    </section>
  </div>
</template>
