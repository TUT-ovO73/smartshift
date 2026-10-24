<template>
  <div class="page">
    <h2>仪表盘</h2>
    <div class="card-grid" v-loading="loading">
      <div class="stat-card">
        <div class="label">班次总数</div>
        <div class="value">{{ ov?.total_shifts ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已发布班次</div>
        <div class="value">{{ ov?.published_shifts ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">排班记录</div>
        <div class="value">{{ ov?.total_assignments ?? '-' }}</div>
      </div>
      <div class="stat-card">
        <div class="label">完成率</div>
        <div class="value">{{ completionRate }}</div>
      </div>
      <div class="stat-card">
        <div class="label">成员人数</div>
        <div class="value">{{ ov?.member_count ?? '-' }}</div>
      </div>
    </div>

    <h3 style="margin-top:24px">积分排行榜</h3>
    <el-table :data="leaderboard" border>
      <el-table-column type="index" label="名次" width="80" />
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="points" label="积分" width="120" />
      <el-table-column prop="completed_count" label="完成数" width="120" />
    </el-table>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '../../stores/team'
import { useStatsStore } from '../../stores/stats'

const team = useTeamStore()
const statsStore = useStatsStore()
const loading = ref(false)

const ov = computed(() => statsStore.overview)
const leaderboard = computed(() => statsStore.leaderboard || [])

const completionRate = computed(() => {
  if (!ov.value) return '-'
  const total = ov.value.total_assignments || 0
  const done = ov.value.completed || 0
  if (!total) return '-'
  return `${Math.round((done / total) * 100)}%`
})

onMounted(async () => {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (!team.currentTeam) return
  loading.value = true
  try {
    await statsStore.loadOverview(team.currentTeam.id)
  } catch (_) {} finally {
    loading.value = false
  }
})
</script>
