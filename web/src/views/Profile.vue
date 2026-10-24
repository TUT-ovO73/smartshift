<template>
  <div class="page">
    <h2>我的</h2>
    <el-card style="margin-bottom:20px">
      <template #header>基本信息</template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ auth.user?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ auth.user?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ roleLabel }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ auth.user?.points ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="信用">{{ auth.user?.credit ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ auth.user?.id }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card>
      <template #header>个人统计</template>
      <div class="card-grid" v-loading="loading">
        <div class="stat-card">
          <div class="label">总班次</div>
          <div class="value">{{ stats?.total_assignments ?? '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="label">已完成</div>
          <div class="value">{{ stats?.completed ?? '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="label">总时长(小时)</div>
          <div class="value">{{ stats?.total_hours ?? '-' }}</div>
        </div>
        <div class="stat-card">
          <div class="label">完成率</div>
          <div class="value">{{ completionRate }}</div>
        </div>
        <div class="stat-card">
          <div class="label">缺席次数</div>
          <div class="value">{{ stats?.absent ?? '-' }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useStatsStore } from '../stores/stats'

const auth = useAuthStore()
const statsStore = useStatsStore()
const stats = ref(null)
const loading = ref(false)

const ROLE_MAP = {
  super_admin: '超级管理员',
  schedule_admin: '排班管理员',
  member: '普通成员',
}
const roleLabel = computed(() => ROLE_MAP[auth.user?.role] || auth.user?.role || '-')

const completionRate = computed(() => {
  if (!stats.value) return '-'
  const total = stats.value.total_assignments || 0
  const done = stats.value.completed || 0
  if (!total) return '-'
  return `${Math.round((done / total) * 100)}%`
})

onMounted(async () => {
  if (!auth.user?.id) return
  loading.value = true
  try {
    await statsStore.loadPersonal(auth.user.id)
    stats.value = statsStore.personal
  } catch (_) {} finally {
    loading.value = false
  }
})
</script>
