import { ElMessageBox } from 'element-plus'
import { defineStore } from 'pinia'
import { getInfo, login, logout } from '@/api/login'
import defAva from '@/assets/images/profile.jpg'
import cache from '@/plugins/cache'
import router from '@/router'
import { getToken, removeToken, setToken } from '@/utils/auth'
import { isEmpty, isHttp } from '@/utils/validate'
import { useDashboardStore } from './dashboard'
import useDictStore from './dict'
import usePermissionStore from './permission'
import usePlatformStore from './platform'
import useTagsViewStore from './tagsView'

interface UserState {
  token: string | undefined
  id: string | number
  name: string
  nickName: string
  avatar: string
  roles: string[]
  permissions: string[]
}

const useUserStore = defineStore(
  'user',
  {
    state: (): UserState => ({
      token: getToken(),
      id: '',
      name: '',
      nickName: '',
      avatar: '',
      roles: [],
      permissions: [],
    }),
    actions: {
      // 登录
      login(userInfo: { username: string, password: string, code: string, uuid: string }) {
        const username = userInfo.username.trim()
        const password = userInfo.password
        const code = userInfo.code
        const uuid = userInfo.uuid
        return new Promise<void>((resolve, reject) => {
          login(username, password, code, uuid).then((res) => {
            setToken(res.token)
            this.token = res.token
            resolve()
          }).catch((error) => {
            reject(error)
          })
        })
      },
      // 获取用户信息
      getInfo() {
        return new Promise((resolve, reject) => {
          getInfo().then((res) => {
            const user = res.user
            let avatar = user.avatar || ''
            if (!isHttp(avatar)) {
              avatar = (isEmpty(avatar)) ? defAva : import.meta.env.VITE_APP_BASE_API + avatar
            }
            if (res.roles && res.roles.length > 0) { // 验证返回的roles是否是一个非空数组
              this.roles = res.roles
              this.permissions = res.permissions
            }
            else {
              this.roles = ['ROLE_DEFAULT']
            }
            this.id = user.userId || ''
            this.name = user.userName || ''
            this.nickName = user.nickName || ''
            this.avatar = avatar
            // 后端可能不返回密码限制类型，缺省按 '0'（仅屏蔽非法字符）处理
            cache.session.set('pwrChrtype', res.pwdChrtype ?? '0')
            /* 初始密码提示 */
            if (res.isDefaultModifyPwd) {
              ElMessageBox.confirm('您的密码还是初始密码，请修改密码！', '安全提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
                router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
              }).catch(() => {})
            }
            /* 过期密码提示 */
            if (!res.isDefaultModifyPwd && res.isPasswordExpired) {
              ElMessageBox.confirm('您的密码已过期，请尽快修改密码！', '安全提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
                router.push({ name: 'Profile', params: { activeTab: 'resetPwd' } })
              }).catch(() => {})
            }
            resolve(res)
          }).catch((error) => {
            reject(error)
          })
        })
      },
      // 退出系统：服务端失败也必须完成本地退出，让现有调用方继续跳转登录页。
      async logOut(): Promise<void> {
        try {
          await logout()
        }
        catch {
          // 本地退出不代表服务端会话已注销，避免输出含认证头的原始错误。
          console.warn('服务端注销失败，已退出本地会话')
        }
        finally {
          this.token = ''
          this.id = ''
          this.name = ''
          this.nickName = ''
          this.avatar = ''
          this.roles = []
          this.permissions = []
          removeToken()
          usePermissionStore().resetRoutes()
          useTagsViewStore().$reset()
          useDictStore().cleanDict()
          useDashboardStore().reset()
          usePlatformStore().resetPlatform()
          cache.local.remove('tags-view-visited')
          cache.session.remove('pwrChrtype')
          cache.session.remove('sessionObj')
        }
      },
    },
  },
)

export default useUserStore
