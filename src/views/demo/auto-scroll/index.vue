<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'DemoAutoScroll',
})

interface Row {
  id: number
  name: string
  value: number
  status: '正常' | '预警' | '报警'
}

const rows = ref<Row[]>(
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `监测点-${String(i + 1).padStart(2, '0')}`,
    value: Number((Math.random() * 100).toFixed(1)),
    status: i % 5 === 0 ? '报警' : i % 3 === 0 ? '预警' : '正常',
  })),
)

const banners = ref<string[]>(
  Array.from({ length: 8 }, (_, i) => `告警横幅 ${i + 1}：皮带温度超限，请及时处置`),
)

function statusClass(status: Row['status']): string {
  if (status === '报警')
    return 'text-[var(--app-danger)]'
  if (status === '预警')
    return 'text-[var(--app-warning)]'
  return 'text-[var(--app-success)]'
}
</script>

<template>
  <div class="app-container flex flex-col gap-3">
    <el-alert type="info" :closable="false" show-icon>
      AutoScroll 演示：悬停暂停 / 滚轮与触摸接管 / 松开后自动重启。列表超高后开始步进滚动。
    </el-alert>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
      <!-- 垂直逐行滚动 -->
      <section class="rounded border border-[var(--app-border)] bg-[var(--app-bg-plain)] p-3 flex flex-col">
        <h3 class="text-sm font-semibold text-[var(--app-text)] mb-2">
          垂直滚动（步进 40px，threshold=3）
        </h3>
        <div class="h-[280px]">
          <AutoScroll
            :items="rows"
            :step-time="2500"
            :step-height="40"
            :threshold="3"
            scrollbar-show-on-hover
          >
            <template #default="{ item, index }">
              <div class="flex items-center justify-between h-full px-2 text-[var(--app-text-secondary)] text-xs border-b border-[var(--app-border)]">
                <span class="w-8 text-[var(--app-text-muted)]">{{ index + 1 }}</span>
                <span class="flex-1">{{ item.name }}</span>
                <span class="w-16 text-right tabular-nums">{{ item.value }}</span>
                <span class="w-12 text-right" :class="statusClass(item.status)">
                  {{ item.status }}
                </span>
              </div>
            </template>
          </AutoScroll>
        </div>
      </section>

      <!-- 水平滚动 -->
      <section class="rounded border border-[var(--app-border)] bg-[var(--app-bg-plain)] p-3 flex flex-col">
        <h3 class="text-sm font-semibold text-[var(--app-text)] mb-2">
          水平滚动（步进 260px，悬停淡入）
        </h3>
        <div class="h-[120px]">
          <AutoScroll
            :items="banners"
            :step-time="2000"
            :step-width="260"
            :threshold="2"
            horizontal
            fade-in-out
          >
            <template #default="{ item, index }">
              <div class="h-[120px] flex items-center justify-center rounded border border-[var(--app-accent-line)] bg-[var(--app-accent-soft)] mx-1">
                <span class="text-sm text-[var(--app-accent)]">{{ item }}（#{{ index + 1 }}）</span>
              </div>
            </template>
          </AutoScroll>
        </div>
      </section>
    </div>
  </div>
</template>
