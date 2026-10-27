<script setup lang="ts">
import useTagsViewStore from '@/store/modules/tagsView'
import InnerLink from '../InnerLink/index.vue'

const route = useRoute()
const tagsViewStore = useTagsViewStore()

function iframeUrl(url: string | undefined, query: Record<string, any> = {}): string {
  const target = url ?? ''
  if (Object.keys(query).length > 0) {
    const params = Object.keys(query).map(key => `${key}=${query[key]}`).join('&')
    return `${target}?${params}`
  }
  return target
}
</script>

<template>
  <InnerLink
    v-for="(item, index) in tagsViewStore.iframeViews"
    v-show="route.path === item.path"
    :key="item.path"
    :iframe-id="`iframe${index}`"
    :src="iframeUrl(item.meta.link, item.query)"
  />
</template>
