import type { UploadFileResult } from '@/types/api/common'
import request from '@/utils/request'

/**
 * 通用文件上传
 *
 * POST /common/upload（multipart/form-data）
 *
 * 走统一请求层，复用 token 注入与错误提示，避免组件内直连 axios（R1）。
 * 关闭防重复提交：粘贴/连续插入图片时 1 秒内多次上传属正常操作。
 */
export function uploadFile(file: File): Promise<UploadFileResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/common/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      'repeatSubmit': false,
    },
  })
}
