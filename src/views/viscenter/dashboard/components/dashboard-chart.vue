<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { getDashboardChart } from '@/config/dashboard-charts'

const props = withDefaults(defineProps<{ chartKey: string, userId: string | number, systemId: string | number, polling?: boolean }>(), { polling: true })
const chart = computed(() => getDashboardChart(props.chartKey))
const VideoWall = defineAsyncComponent(() => import('./video-wall.vue'))
const StatChart = defineAsyncComponent(() => import('./stat-chart.vue'))
</script>

<template>
  <ChartBox :title="chart?.title || chartKey">
    <VideoWall v-if="chartKey === 'charts1'" :user-id="userId" :system-id="systemId" :polling="polling" />
    <StatChart v-else-if="chart?.available" :chart-key="chartKey" :system-id="systemId" :polling="polling" />
    <el-empty v-else description="此旧图表尚未迁移，请在主页排版中替换" :image-size="36" />
  </ChartBox>
</template>
