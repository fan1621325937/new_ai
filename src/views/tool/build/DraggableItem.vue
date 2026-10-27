<template>
  <el-col :span="element.span" :class="className" @click.stop="activeItem(element)">
    <el-form-item :label="element.label" :label-width="element.labelWidth ? element.labelWidth + 'px' : undefined"
      :required="element.required" v-if="element.layout === 'colFormItem'">
      <render :key="element.tag" :conf="element" v-model="element.defaultValue" />
    </el-form-item>
    <el-row :gutter="element.gutter" :class="element.class" @click.stop="activeItem(element)" v-else>
      <span class="component-name"> {{ element.componentName }} </span>
      <draggable group="componentsGroup" :animation="340" :list="element.children" class="drag-wrapper" item-key="label"
        ref="draggableItemRef" :component-data="getComponentData()">
        <template #item="scoped">
          <draggable-item :key="scoped.element.renderKey" :drawing-list="element.children" :element="scoped.element"
            :index="index" :active-id="activeId" :form-conf="formConf" @activeItem="activeItem(scoped.element)"
            @copyItem="copyItem(scoped.element, element.children)"
            @deleteItem="deleteItem(scoped.index, element.children)" />
        </template>
      </draggable>
    </el-row>
    <span class="drawing-item-copy" title="复制" @click.stop="copyItem(element)">
      <el-icon><CopyDocument /></el-icon>
    </span>
    <span class="drawing-item-delete" title="删除" @click.stop="deleteItem(index)">
      <el-icon><Delete /></el-icon>
    </span>
  </el-col>
</template>
<script setup lang="ts" name="DraggableItem">
import draggable from "vuedraggable/dist/vuedraggable.common"
import render from '@/utils/generator/render'
import type { FormConf, FormWidget } from './types'

const props = withDefaults(defineProps<{
  element: FormWidget
  index?: number
  drawingList?: FormWidget[]
  activeId?: string | number
  formConf?: FormConf
}>(), {
  drawingList: () => [],
  formConf: () => ({}),
})
const className = ref('')
const draggableItemRef = ref(null)
const emits = defineEmits<{
  (e: 'activeItem', item: FormWidget): void
  (e: 'copyItem', item: FormWidget, parent?: FormWidget[]): void
  (e: 'deleteItem', item: number | undefined, parent?: FormWidget[]): void
}>()

function activeItem(item: FormWidget): void {
  emits('activeItem', item)
}
function copyItem(item: FormWidget, parent?: FormWidget[]): void {
  emits('copyItem', item, parent ?? props.drawingList)
}
function deleteItem(item: number | undefined, parent?: FormWidget[]): void {
  emits('deleteItem', item, parent ?? props.drawingList)
}

function getComponentData(): Record<string, unknown> {
  return {
    gutter: props.element.gutter,
    justify: props.element.justify,
    align: props.element.align
  }
}

watch(() => props.activeId, (val?: string | number) => {
  className.value = (props.element.layout === 'rowFormItem' ? 'drawing-row-item' : 'drawing-item') + (val === props.element.formId ? ' active-from-item' : '')
  if (props.formConf.unFocusedComponentBorder) {
    className.value += ' unfocus-bordered'
  }
}, { immediate: true })
</script>
