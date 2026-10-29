# 智能管理系统

基于 Vue 3 + TypeScript + Vite + Element Plus + Pinia 的中后台管理平台。

## 环境要求

- Node.js 22.12+（CI 使用 Node 22，本地推荐 Node 24）
- 后端服务 `http://172.16.41.201:8889`（`/dev-api` 代理，配置见 `vite.config.ts`）

## 快速开始

```bash
# 按版本管理中的 package-lock.json 安装依赖
npm ci

# 启动开发服务（http://localhost:86）
npm run dev

# 类型检查（全量 0 error 强制门禁）
npm run type-check

# 回归测试
npm test

# 生产构建
npm run build:prod

# 预发布构建
npm run build:stage
```

## 目录结构

```
├── src/
│   ├── api/          # 接口模块
│   ├── assets/       # 静态资源
│   ├── components/   # 全局组件
│   ├── directive/    # 自定义指令（权限等）
│   ├── layout/       # 页面布局
│   ├── router/        # 路由
│   ├── store/        # Pinia 状态
│   ├── types/        # TS 类型定义
│   ├── utils/        # 工具函数
│   └── views/        # 页面
└── vite/             # Vite 插件配置
```
