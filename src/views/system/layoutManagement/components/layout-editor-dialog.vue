<script setup lang="ts">
import { useLayoutDesigner } from '../composables/use-layout-designer'
import LayoutDesignCanvas from './layout-design-canvas.vue'

const emit = defineEmits<{ success: [] }>()
const { editor, visible, loading, saving, error, saveError, info, readOnly, legacy, preview, dirty, open, load, close, clear, removeSelected, save } = useLayoutDesigner(() => emit('success'))

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="visible" :title="`${readOnly ? '预览' : '设计'} · ${info?.name || '布局'}`" width="94%" top="4vh"
    append-to-body destroy-on-close :before-close="close" :close-on-click-modal="false" :close-on-press-escape="false"
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
          class="mb-4" type="info" :closable="false" show-icon
          :title="legacy ? '旧模板仅支持只读预览，不能修改几何。请新建布局后设计。' : '仅管理卡槽几何，不修改图表绑定；图表内容请到主页配置。'"
        />
        <div v-if="!readOnly" class="mb-4 flex flex-wrap items-center gap-3">
          <el-button v-hasPermi="['system:layout:edit']" :disabled="saving || preview || !editor.state.cards.length" @click="clear">
            清空
          </el-button>
          <el-button v-hasPermi="['system:layout:edit']" :disabled="saving || preview || !editor.state.selectedId" @click="removeSelected">
            删除所选
          </el-button>
          <el-button :disabled="saving" @click="preview = !preview">
            {{ preview ? '返回编辑' : '预览' }}
          </el-button>
          <span class="text-[var(--app-text-muted)]">{{ editor.state.cards.length }} 个卡槽 · {{ dirty ? '有未保存修改' : '未修改' }}</span>
        </div>
        <el-alert v-if="saveError" class="mb-4" :title="saveError" type="error" :closable="false" show-icon />
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
  </el-dialog>
</template>
