<template>
  <div class="app-container flex items-center justify-center h-[calc(100vh-130px)]">
    <div class="text-center">
      <h2 class="mb-3 text-xl font-semibold text-fg">
        {{ title }}
      </h2>
      <p class="text-fg-muted">
        欢迎使用本系统，请从顶部菜单开始导航
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const title = import.meta.env.VITE_APP_TITLE
</script>
