<script setup lang="ts">
import type { ChartDateItem } from './types'
import { ref } from 'vue'

defineOptions({
  name: 'ChartBox',
})

const props = withDefaults(defineProps<{
  title?: string
  showTitle?: boolean
  decPad?: boolean
  showDate?: boolean
  dateInfo?: ChartDateItem[]
}>(), {
  title: '标题',
  showTitle: true,
  decPad: true,
  showDate: false,
  dateInfo: () => [
    { title: '日' },
    { title: '月' },
    { title: '年' },
  ],
})

const emits = defineEmits<{
  (e: 'handleDate', item: ChartDateItem): void
}>()

const activeDate = ref(props.dateInfo[0]?.title ?? '')

function handleDate(item: ChartDateItem): void {
  activeDate.value = item.title
  emits('handleDate', item)
}
</script>

<template>
  <div class="chart-box">
    <div v-if="showTitle" class="chart-box__header">
      <div class="chart-box__title-wrap">
        <div class="chart-box__title">
          {{ title }}
        </div>
      </div>
      <div class="chart-box__actions">
        <slot name="selectBox" />
      </div>
    </div>

    <div v-if="showDate" class="chart-box__date">
      <span
        v-for="item in dateInfo"
        :key="item.title"
        class="chart-box__date-item"
        :class="{ 'chart-box__date-item--active': item.title === activeDate }"
        @click="handleDate(item)"
      >
        {{ item.title }}
      </span>
    </div>

    <div class="chart-box__extra">
      <slot name="othertitle" />
    </div>

    <div class="chart-box__content" :class="{ 'chart-box__content--pad': decPad }">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" src="./style.scss" scoped></style>
