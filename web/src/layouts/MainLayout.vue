<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="logo">智排班 SmartShift</div>
      <el-dropdown @command="onCommand">
        <span class="user">
          {{ auth.user?.name || auth.user?.username || '用户' }}
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">我的</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/calendar">排班日历</el-menu-item>
          <el-menu-item index="/availability">可用时间</el-menu-item>
          <el-menu-item index="/checkin">签到</el-menu-item>
          <el-menu-item index="/points">积分中心</el-menu-item>
          <el-menu-item index="/profile">我的</el-menu-item>
          <el-menu-item v-if="auth.isAdmin" index="/admin">管理后台</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useTeamStore } from '../stores/team'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const team = useTeamStore()

const activeMenu = computed(() => route.path)

onMounted(async () => {
  try {
    await auth.fetchMe()
  } catch (_) {}
  try {
    await team.loadTeams()
  } catch (_) {}
})

function onCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.replace({ name: 'login' })
  } else if (cmd === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.layout { height: 100vh; }
.header { display: flex; align-items: center; justify-content: space-between; background: #001529; color: #fff; }
.header .logo { font-size: 18px; font-weight: 600; }
.header .user { color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.aside { background: #fff; border-right: 1px solid #e6e8eb; }
.main { background: #f5f7fa; }
</style>
