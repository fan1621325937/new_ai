<script setup lang="ts">
import AppDialog from '@/components/AppDialog/index.vue'
import { useLayoutDesigner } from '../composables/use-layout-designer'
import LayoutDesignCanvas from './layout-design-canvas.vue'

const emit = defineEmits<{ success: [] }>()
const { editor, visible, loading, saving, error, saveError, info, readOnly, legacy, preview, dirty, open, load, close, clear, removeSelected, save } = useLayoutDesigner(() => emit('success'))

defineExpose({ open })
</script>

<template>
  <AppDialog
    v-model="visible"
    :title="`${readOnly ? '预览' : '设计'} · ${info?.name || '布局'}`"
    type="primary"
    width="94%"
    top="3vh"
    drag
    :before-close="close"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div v-loading="loading" class="min-h-32">
      <div v-if="error" class="flex items-center gap-4" role="alert">
        <el-alert :title="error" type="error" :closable="false" show-icon />
        <el-button :loading="loading" @click="load">
          重试
        </el-button>
      </div>

      <template v-else-if="info">
        <el-alert
          class="mb-3" type="info" :closable="false" show-icon
          :title="legacy ? '旧模板仅支持只读预览，不能修改几何。请新建布局后设计。' : '仅管理卡槽几何，不修改图表绑定；图表内容请到主页配置。'"
        />

        <div class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-subtle)] p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-semibold text-[var(--app-text)]">{{ info.name }}</span>
            <el-tag v-if="legacy" type="info" size="small">
              旧版模板 · 只读
            </el-tag>
            <span class="rounded bg-[var(--app-bg-card)] px-2 py-0.5 text-xs text-[var(--app-text-muted)]">
              24×24 栅格 · {{ editor.state.cards.length }} 个卡槽
            </span>
            <el-tag v-if="dirty" type="warning" size="small">
              有未保存修改
            </el-tag>
          </div>

          <div v-if="!readOnly" class="flex flex-wrap items-center gap-2">
            <el-button size="small" :type="preview ? 'primary' : 'default'" :disabled="saving" @click="preview = !preview">
              {{ preview ? '返回编辑' : '大屏预览' }}
            </el-button>
            <el-button v-hasPermi="['system:layout:edit']" size="small" :disabled="saving || preview || !editor.state.cards.length" @click="clear">
              清空
            </el-button>
            <el-button v-hasPermi="['system:layout:edit']" size="small" type="danger" plain :disabled="saving || preview || !editor.state.selectedId" @click="removeSelected">
              删除卡槽
            </el-button>
            <el-button v-hasPermi="['system:layout:edit']" size="small" type="primary" :loading="saving" @click="save">
              保存布局
            </el-button>
          </div>
        </div>

        <el-alert v-if="saveError" class="mb-3" :title="saveError" type="error" :closable="false" show-icon />
        <LayoutDesignCanvas :editor="editor" :read-only="readOnly" :preview="preview" :disabled="saving" />
      </template>
    </div>

    <template #footer>
      <el-button :disabled="saving" @click="close">
        关闭
      </el-button>
      <el-button v-if="!readOnly && info && !error" v-hasPermi="['system:layout:edit']" type="primary" :loading="saving" @click="save">
        保存布局
      </el-button>
    </template>
  </AppDialog>
</template>
