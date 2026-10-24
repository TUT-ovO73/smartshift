<template>
  <div class="page">
    <h2>统计报表</h2>

    <h3>完成率趋势</h3>
    <el-card style="margin-bottom:20px">
      <div v-if="!completion.length" class="empty">暂无数据</div>
      <div v-else class="trend">
        <div v-for="(d, i) in completion" :key="i" class="trend-item">
          <div class="trend-date">{{ d.date }}</div>
          <el-progress
            :percentage="percent(d)"
            :status="percent(d) >= 80 ? 'success' : percent(d) < 50 ? 'exception' : ''"
          />
          <div class="trend-text">{{ d.completed || 0 }} / {{ d.total || 0 }}</div>
        </div>
      </div>
    </el-card>

    <h3>个人统计查询</h3>
    <el-card style="margin-bottom:20px">
      <el-form inline>
        <el-form-item label="成员">
          <el-select v-model="userId" filterable placeholder="选择成员" style="width:200px">
            <el-option
              v-for="m in team.members"
              :key="m.user_id || m.id"
              :label="m.name || m.username"
              :value="m.user_id || m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <div v-if="statsStore.personal" class="card-grid">
        <div class="stat-card"><div class="label">总班次</div><div class="value">{{ statsStore.personal.total_assignments ?? '-' }}</div></div>
        <div class="stat-card"><div class="label">已完成</div><div class="value">{{ statsStore.personal.completed ?? '-' }}</div></div>
        <div class="stat-card"><div class="label">总时长</div><div class="value">{{ statsStore.personal.total_hours ?? '-' }}</div></div>
        <div class="stat-card"><div class="label">缺席</div><div class="value">{{ statsStore.personal.absent ?? '-' }}</div></div>
      </div>
    </el-card>

    <h3>排行榜</h3>
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
const userId = ref(null)

const completion = computed(() => statsStore.completion || [])
const leaderboard = computed(() => statsStore.leaderboard || [])

function percent(d) {
  const total = d.total || 0
  if (!total) return 0
  return Math.round(((d.completed || 0) / total) * 100)
}

async function onSearch() {
  if (!userId.value) return
  try {
    await statsStore.loadPersonal(userId.value)
  } catch (_) {}
}

onMounted(async () => {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (team.currentTeam) {
    try { await team.loadMembers(team.currentTeam.id) } catch (_) {}
    try { await statsStore.loadOverview(team.currentTeam.id) } catch (_) {}
    try { await statsStore.loadCompletion(team.currentTeam.id) } catch (_) {}
  }
})
</script>

<style scoped>
.empty { color: #909399; padding: 16px; text-align: center; }
.trend { display: flex; flex-direction: column; gap: 12px; }
.trend-item { display: grid; grid-template-columns: 100px 1fr 80px; align-items: center; gap: 12px; }
.trend-date { color: #606266; font-size: 14px; }
.trend-text { color: #909399; font-size: 12px; }
</style>
