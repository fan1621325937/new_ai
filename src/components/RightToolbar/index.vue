<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus'
import type { TableShowColumns } from '@/types/api/common'
import cache from '@/plugins/cache'

/** 调用方可传数组，也可传 key → 列配置的对象（两种历史写法都存在） */
type ColumnSource = TableShowColumns[] | Record<string, TableShowColumns>

const props = withDefaults(defineProps<{
  /* 是否显示检索条件 */
  showSearch?: boolean
  /* 显隐列信息（数组格式、对象格式） */
  columns?: ColumnSource
  /* 是否显示检索图标 */
  search?: boolean
  /* 显隐列类型（transfer穿梭框、checkbox复选框） */
  showColumnsType?: 'checkbox' | 'transfer'
  /* 右外边距 */
  gutter?: number
  /* 列显隐状态记忆的 localStorage key（传入则启用记忆，不传则不记忆） */
  storageKey?: string
}>(), {
  showSearch: true,
  columns: () => ({}),
  search: true,
  showColumnsType: 'checkbox',
  gutter: 10,
  storageKey: '',
})

const emits = defineEmits<{
  (e: 'update:showSearch', show: boolean): void
  (e: 'queryTable'): void
}>()

// 显隐数据
const value = ref<number[]>([])
// 弹出层标题
const title = ref('显示/隐藏')
// 是否显示弹出层
const open = ref(false)

const style = computed(() => {
  const ret: Record<string, string> = {}
  if (props.gutter) {
    ret.marginRight = `${props.gutter / 2}px`
  }
  return ret
})

/** 归一化后的列列表：对象形态按 key 顺序取值，避免后续处处判 Array/Object */
const columnList = computed<TableShowColumns[]>(() => {
  const src = props.columns
  return Array.isArray(src) ? src : Object.keys(src).map(key => src[key])
})
/** 每列在原始入参中的 key（数组用下标，对象用原 key），用于持久化与回填 */
const columnKeys = computed<string[]>(() => {
  const src = props.columns
  return Array.isArray(src) ? src.map((_, index) => String(index)) : Object.keys(src)
})

// 是否全选/半选 状态
const isChecked = computed({
  get: () => columnList.value.every(col => col.visible),
  set: () => {},
})
const isIndeterminate = computed(() => columnList.value.some(col => col.visible) && !isChecked.value)
const transferData = computed(() => columnList.value.map((item, index) => ({ key: index, label: item.label })))

// 搜索
const proxy = useGlobalProxy()
function toggleSearch(): void {
  let el: HTMLElement | null = proxy.$el as HTMLElement | null
  let formEl: HTMLElement | null = null
  while (true) {
    el = el?.parentElement ?? null
    if (!el || el === document.body)
      break
    formEl = el.querySelector('.el-form')
    if (formEl)
      break
  }
  if (!formEl)
    return emits('update:showSearch', !props.showSearch)
  animateSearch(formEl, props.showSearch)
}
function animateSearch(el: HTMLElement, isHide: boolean): void {
  const DURATION = 260
  const TRANSITION = 'max-height 0.25s ease, opacity 0.2s ease'
  const clear = () => Object.assign(el.style, { transition: '', maxHeight: '', opacity: '', overflow: '' })
  Object.assign(el.style, { overflow: 'hidden', transition: '' })
  if (isHide) {
    Object.assign(el.style, { maxHeight: `${el.scrollHeight}px`, opacity: '1', transition: TRANSITION })
    requestAnimationFrame(() => Object.assign(el.style, { maxHeight: '0', opacity: '0' }))
    setTimeout(() => { emits('update:showSearch', false); clear() }, DURATION)
  }
  else {
    emits('update:showSearch', true)
    nextTick(() => {
      Object.assign(el.style, { maxHeight: '0', opacity: '0' })
      requestAnimationFrame(() => requestAnimationFrame(() => {
        Object.assign(el.style, { transition: TRANSITION, maxHeight: `${el.scrollHeight}px`, opacity: '1' })
      }))
      setTimeout(clear, DURATION)
    })
  }
}

// 刷新
function refresh(): void {
  emits('queryTable')
}

// 右侧列表元素变化（穿梭框传入的是列下标）
function dataChange(data: Array<string | number>): void {
  columnList.value.forEach((col, index) => {
    col.visible = !data.includes(index)
  })
  saveStorage()
}

// 打开显隐列dialog
function showColumn(): void {
  open.value = true
}

// 如果传入了 storageKey，从 localStorage 恢复列显隐状态
if (props.storageKey) {
  try {
    const saved = cache.local.getJSON(props.storageKey)
    if (saved && typeof saved === 'object') {
      columnList.value.forEach((col, index) => {
        const key = columnKeys.value[index]
        if (saved[key] !== undefined)
          col.visible = saved[key]
      })
    }
  }
  catch (e) {}
}
if (props.showColumnsType === 'transfer') {
  // transfer 穿梭显隐列初始默认隐藏列
  columnList.value.forEach((col, index) => {
    if (col.visible === false)
      value.value.push(index)
  })
}

// 单勾选
function checkboxChange(event: CheckboxValueType, key: string | number): void {
  const col = columnList.value[columnKeys.value.indexOf(String(key))]
  if (col) {
    col.visible = event === true
  }
  saveStorage()
}

// 切换全选/反选
function toggleCheckAll(): void {
  const newValue = !isChecked.value
  columnList.value.forEach((col) => {
    col.visible = newValue
  })
  saveStorage()
}

// 将当前列显隐状态持久化到 localStorage
function saveStorage(): void {
  if (!props.storageKey)
    return
  try {
    const state: Record<string, boolean> = {}
    columnList.value.forEach((col, index) => {
      state[columnKeys.value[index]] = col.visible
    })
    cache.local.setJSON(props.storageKey, state)
  }
  catch (e) {}
}
</script>

<template>
  <div class="top-right-btn" :style="style">
    <el-row>
      <el-tooltip v-if="search" class="item" effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
        <el-button circle icon="Search" @click="toggleSearch()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="刷新" placement="top">
        <el-button circle icon="Refresh" @click="refresh()" />
      </el-tooltip>
      <el-tooltip v-if="columnList.length > 0" class="item" effect="dark" content="显隐列" placement="top">
        <el-button v-if="showColumnsType == 'transfer'" circle icon="Menu" @click="showColumn()" />
        <el-dropdown v-if="showColumnsType == 'checkbox'" trigger="click" :hide-on-click="false" style="padding-left: 12px">
          <el-button circle icon="Menu" />
          <template #dropdown>
            <el-dropdown-menu>
              <!-- 全选/反选 按钮 -->
              <el-dropdown-item>
                <el-checkbox v-model="isChecked" :indeterminate="isIndeterminate" @change="toggleCheckAll">
                  列展示
                </el-checkbox>
              </el-dropdown-item>
              <div class="check-line" />
              <template v-for="(item, key) in columnList" :key="key">
                <el-dropdown-item>
                  <el-checkbox v-model="item.visible" :label="item.label" @change="checkboxChange($event, key)" />
                </el-dropdown-item>
              </template>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-tooltip>
    </el-row>
    <el-dialog v-model="open" :title="title" append-to-body>
      <el-transfer
        v-model="value"
        :titles="['显示', '隐藏']"
        :data="transferData"
        @change="dataChange"
      />
    </el-dialog>
  </div>
</template>

<style lang='scss' scoped>
:deep(.el-transfer__button) {
  border-radius: 50%;
  display: block;
  margin-left: 0;
}
:deep(.el-transfer__button:first-child) {
  margin-bottom: 10px;
}
:deep(.el-dropdown-menu__item) {
  line-height: 30px;
  padding: 0 17px;
}
.check-line {
  width: 90%;
  height: 1px;
  background-color: var(--el-border-color-darker);
  margin: 3px auto;
}
</style>
