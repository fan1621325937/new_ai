<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({
  title: 'AI 边缘监控节点配置',
  code: 'EDGE-2026-0922',
  type: 'video',
  level: 'high',
  desc: '负责高清人脸与动态车牌实时推流结构化计算分析。',
  enabled: true,
})
</script>

<template>
  <div class="demo-form-container">
    <el-form :model="formData" label-width="110px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="节点名称">
            <el-input v-model="formData.title" placeholder="请输入节点名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="节点编码">
            <el-input v-model="formData.code" placeholder="请输入节点编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="业务类型">
            <el-select v-model="formData.type" class="w-full">
              <el-option label="视频结构化" value="video" />
              <el-option label="声纹感知" value="audio" />
              <el-option label="温湿度传感" value="sensor" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="布控级别">
            <el-radio-group v-model="formData.level">
              <el-radio value="high">核心重保</el-radio>
              <el-radio value="medium">标准日常</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="详细说明">
            <el-input
              v-model="formData.desc"
              type="textarea"
              :rows="4"
              placeholder="请输入布控节点详细描述..."
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
