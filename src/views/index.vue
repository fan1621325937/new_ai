<template>
  <div class="app-container home">
    <div class="home-card">
      <h2>{{ title }}</h2>
      <p>欢迎使用本系统，请从左侧菜单开始导航</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const title = import.meta.env.VITE_APP_TITLE
</script>

<style scoped lang="scss">
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 130px);

  .home-card {
    text-align: center;

    h2 {
      margin-bottom: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
