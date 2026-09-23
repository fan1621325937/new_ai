/**
 * 全局组件统一注册入口
 *
 * 规范（详见 src/components/README.md）：
 * 1. 需要全局使用的组件，只在这里登记一次（新增/删除组件都只改本文件）
 * 2. 页面/业务组件不要全局注册，按需 import，避免主包体积膨胀
 * 3. 组件命名：注册名 PascalCase（模板中使用 <Pagination />）；svg-icon 等既有小写名保持兼容
 * 4. 组件自身的 props/emits 类型定义在组件目录的 types.ts；跨组件复用的类型放 src/types/components/
 */
import type { App, Component } from 'vue'

import AppDialog from './AppDialog/index.vue'
import DictTag from './DictTag/index.vue'
import Editor from './Editor/index.vue'
import FileUpload from './FileUpload/index.vue'
import FormLayout from './FormLayout/index.vue'
import ImagePreview from './ImagePreview/index.vue'
import ImageUpload from './ImageUpload/index.vue'
import Pagination from './Pagination/index.vue'
import RightToolbar from './RightToolbar/index.vue'
import SvgIcon from './SvgIcon/index.vue'

/** 全局组件登记表：key 为模板中使用的标签名 */
export const GLOBAL_COMPONENTS: Record<string, Component> = {
  // 监控科技主题弹窗（支持5大信息主题与防逃逸拖拽）
  AppDialog,
  // 字典标签
  DictTag,
  // 富文本编辑器
  Editor,
  // 文件上传
  FileUpload,
  // 多模态表单页面布局组件（支持上下收缩、左右收缩与复合嵌套布局）
  FormLayout,
  // 图片上传
  ImageUpload,
  // 图片预览
  ImagePreview,
  // 分页
  Pagination,
  // 表格右侧工具栏
  RightToolbar,
  // svg 图标（沿用既有小写标签名，模板中使用 <svg-icon />）
  'svg-icon': SvgIcon,
}

/** 注册全部全局组件 */
export function setupGlobalComponents(app: App): void {
  Object.entries(GLOBAL_COMPONENTS).forEach(([name, component]) => {
    app.component(name, component)
  })
}
