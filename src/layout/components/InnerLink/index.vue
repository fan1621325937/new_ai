<script setup lang="ts">
const props = defineProps({
  src: {
    type: String,
    default: '/',
  },
  iframeId: {
    type: String,
  },
})

const loading = ref<boolean>(true)
const height = ref<string>(`${document.documentElement.clientHeight - 94.5}px`)
const iframeRef = ref<HTMLIFrameElement | null>(null)

onMounted(() => {
  if (iframeRef.value) {
    iframeRef.value.onload = () => {
      loading.value = false
    }
  }
})
</script>

<template>
  <div v-loading="loading" :style="`height:${height}`" element-loading-text="正在加载页面，请稍候！">
    <iframe
      :id="iframeId"
      ref="iframeRef"
      style="width: 100%; height: 100%"
      :src="src"
      frameborder="no"
    />
  </div>
</template>
