<template>
  <el-container class="layout">
    <el-header class="header">
      <div class="logo">智排班 · 管理后台</div>
      <div class="actions">
        <el-button text @click="$router.push('/')">返回成员端</el-button>
        <el-dropdown @command="onCommand">
          <span class="user">
            {{ auth.user?.name || auth.user?.username || '管理员' }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/admin/dashboard">仪表盘</el-menu-item>
          <el-menu-item index="/admin/members">成员管理</el-menu-item>
          <el-menu-item index="/admin/shifts">班次管理</el-menu-item>
          <el-menu-item index="/admin/schedule">智能排班</el-menu-item>
          <el-menu-item index="/admin/points-rules">积分规则</el-menu-item>
          <el-menu-item index="/admin/stats">统计报表</el-menu-item>
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
    await team.loadTeams()
    if (team.currentTeam) {
      await team.loadMembers(team.currentTeam.id)
    }
  } catch (_) {}
})

function onCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.replace({ name: 'login' })
  }
}
</script>

<style scoped>
.layout { height: 100vh; }
.header { display: flex; align-items: center; justify-content: space-between; background: #001529; color: #fff; }
.header .logo { font-size: 18px; font-weight: 600; }
.header .actions { display: flex; align-items: center; gap: 12px; }
.header .user { color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.aside { background: #fff; border-right: 1px solid #e6e8eb; }
.main { background: #f5f7fa; }
</style>
