import { defineStore } from 'pinia'
import { authApi } from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('smartshift_token') || '',
    user: JSON.parse(localStorage.getItem('smartshift_user') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => ['super_admin', 'schedule_admin'].includes(s.user?.role),
    isAdminOnly: (s) => s.user?.role === 'super_admin',
  },
  actions: {
    async login(username, password) {
      const res = await authApi.login({ username, password })
      this.token = res.token
      this.user = res.user
      localStorage.setItem('smartshift_token', res.token)
      localStorage.setItem('smartshift_user', JSON.stringify(res.user))
      return res
    },
    async fetchMe() {
      const res = await authApi.me()
      this.user = res.user
      localStorage.setItem('smartshift_user', JSON.stringify(res.user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('smartshift_token')
      localStorage.removeItem('smartshift_user')
    },
  },
})
