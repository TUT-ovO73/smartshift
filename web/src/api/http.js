import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const http = axios.create({ baseURL: '/api', timeout: 15000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartshift_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || '请求失败'
    if (err.response?.status === 401) {
      localStorage.removeItem('smartshift_token')
      localStorage.removeItem('smartshift_user')
      router.replace({ name: 'login' })
    }
    ElMessage.error(msg)
    return Promise.reject(err)
  }
)

export default http
