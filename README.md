# 智能管理系统

基于 Vue 3 + TypeScript + Vite + Element Plus + Pinia 的中后台管理平台。

## 环境要求

- Node.js >= 18
- 后端服务（默认 `http://localhost:8080`，代理配置见 `vite.config.ts`）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

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
