import ElementPlus from 'element-plus'

import locale from 'element-plus/es/locale/lang/zh-cn'

import Cookies from 'js-cookie'
import { createApp } from 'vue'
import { getConfigKey } from '@/api/system/config'
// 全局组件统一注册入口（新增全局组件只改 src/components/index.ts）
import { setupGlobalComponents } from '@/components'
import elementIcons from '@/components/SvgIcon/svgicon'
import { useDict } from '@/utils/dict'
import { download } from '@/utils/request'

import { addDateRange, handleTree, parseTime, resetForm, selectDictLabel, selectDictLabels } from '@/utils/ruoyi'

import App from './App.vue'
import directive from './directive/index.js' // directive
// 注册指令
import plugins from './plugins/index.js' // plugins

import router from './router/index.js'
import store from './store/index.js'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/index.scss' // global css
import '@/assets/styles/tailwind.css' // tailwind utilities
// svg图标
import 'virtual:svg-icons-register'
import './permission.js' // permission control

const app = createApp(App)

// 全局方法挂载
app.config.globalProperties.useDict = useDict
app.config.globalProperties.download = download
app.config.globalProperties.parseTime = parseTime
app.config.globalProperties.resetForm = resetForm
app.config.globalProperties.handleTree = handleTree
app.config.globalProperties.addDateRange = addDateRange
app.config.globalProperties.getConfigKey = getConfigKey
app.config.globalProperties.selectDictLabel = selectDictLabel
app.config.globalProperties.selectDictLabels = selectDictLabels

// 全局组件挂载
setupGlobalComponents(app)

app.use(router)
app.use(store)
app.use(plugins)
app.use(elementIcons)

directive(app)

// 使用element-plus 并且设置全局的大小
// @ts-ignore
app.use(ElementPlus, {
  locale,
  // 支持 large、default、small
  size: Cookies.get('size') || 'default',
})

app.mount('#app')
