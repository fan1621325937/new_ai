<script setup lang="ts">
import type { ThemePresetConfig, ThemePresetKey } from '@/theme'
import useSettingsStore from '@/store/modules/settings'
import { THEME_PRESETS } from '@/theme'

const settingsStore = useSettingsStore()
const currentPresetKey = computed<ThemePresetKey>(() => settingsStore.themePreset)

function handleSelectPreset(preset: ThemePresetConfig): void {
  settingsStore.setThemePreset(preset.key)
}

function getPresetBg(preset: ThemePresetConfig): string {
  return preset.bgPageGradient || preset.surfaces.bgPage
}

function getPresetAccent(preset: ThemePresetConfig): string {
  return preset.gradient || preset.badgeColor
}
</script>

<template>
  <div class="theme-picker">
    <div class="theme-picker__grid grid grid-cols-2 gap-2.5">
      <button
        v-for="preset in THEME_PRESETS"
        :key="preset.key"
        type="button"
        class="theme-picker__item flex items-center gap-2.5 p-2 rounded-md border transition-all cursor-pointer text-left"
        :class="[
          currentPresetKey === preset.key
            ? 'theme-picker__item--active border-primary bg-primary/10 shadow-sm'
            : 'border-line hover:border-primary-line bg-surface hover:bg-surface-hover',
        ]"
        :title="preset.description"
        @click="handleSelectPreset(preset)"
      >
        <!-- 主色流光与渐变大背景双曲预览球 -->
        <span
          class="theme-picker__preview flex-shrink-0 w-6 h-6 rounded-full shadow-inner relative overflow-hidden border border-line"
          :style="{ background: getPresetBg(preset) }"
        >
          <span
            class="absolute top-0 right-0 bottom-0 w-1/2"
            :style="{ background: getPresetAccent(preset) }"
          />
          <svg
            v-if="currentPresetKey === preset.key"
            class="w-3.5 h-3.5 absolute inset-0 m-auto text-white drop-shadow"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <div class="theme-picker__meta flex-1 min-w-0">
          <div class="text-xs font-semibold text-fg truncate flex items-center gap-1">
            <span>{{ preset.name }}</span>
            <span
              class="text-[9px] px-1 py-0.2 rounded font-normal"
              :class="preset.mode === 'dark' ? 'text-amber-300 bg-amber-950/40' : 'text-sky-600 bg-sky-100 dark:bg-sky-950/40'"
            >{{ preset.mode === 'dark' ? '深色' : '亮色' }}</span>
          </div>
          <div class="text-[10px] text-fg-muted truncate">
            {{ preset.description }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.theme-picker {
  &__item {
    outline: none;

    &--active {
      border-color: var(--el-color-primary);
      background-color: var(--app-accent-soft);
    }
  }

  &__preview {
    border-color: var(--app-border);
  }
}
</style>
