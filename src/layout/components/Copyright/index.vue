<script setup lang="ts">
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const visible = computed(() => settingsStore.footerVisible)
const isCollapsed = computed(() => appStore.headerCollapsed)
const content = computed(() => settingsStore.footerContent)
</script>

<template>
  <footer v-if="visible" class="copyright" :class="{ 'is-collapsed': isCollapsed }">
    <span>{{ content }}</span>
  </footer>
</template>

<style scoped>
.copyright {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  padding: 10px 20px;
  text-align: right;
  background-color: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 14px;
  border-top: 1px solid var(--el-fill-color);
  z-index: 999;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-collapsed {
    transform: translateY(100%);
    pointer-events: none;
  }
}
</style>
