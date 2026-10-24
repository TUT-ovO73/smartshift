<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <h2>智排班 SmartShift</h2>
      <el-form :model="form" label-width="70px" @submit.prevent="onLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="password" />
        </el-form-item>
        <el-button type="primary" :loading="loading" @click="onLogin" style="width:100%">登录</el-button>
      </el-form>
      <div class="quick">
        <div class="quick-title">快速登录：</div>
        <el-button size="small" @click="quickLogin('admin', '123456')">admin</el-button>
        <el-button size="small" @click="quickLogin('manager', '123456')">manager</el-button>
        <el-button size="small" @click="quickLogin('alice', '123456')">alice</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function onLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    // error already toasted by http interceptor
  } finally {
    loading.value = false
  }
}

function quickLogin(username, password) {
  form.username = username
  form.password = password
  onLogin()
}
</script>

<style scoped>
.login-wrap { height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #409eff 0%, #001529 100%); }
.login-card { width: 380px; padding: 12px; }
.login-card h2 { text-align: center; margin-bottom: 20px; color: #303133; }
.quick { margin-top: 12px; text-align: center; }
.quick-title { color: #909399; font-size: 12px; margin-bottom: 8px; }
</style>
