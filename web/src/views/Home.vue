<template>
  <div class="page">
    <h2>首页</h2>
    <div class="card-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="label">我的积分</div>
        <div class="value">{{ points.balance.points }}</div>
      </div>
      <div class="stat-card">
        <div class="label">我的信用</div>
        <div class="value">{{ auth.user?.credit ?? '-' }}</div>
      </div>
    </div>

    <h3>今日值班</h3>
    <div v-if="todayAssignments.length" class="card-grid">
      <el-card v-for="a in todayAssignments" :key="a.id" shadow="hover">
        <div class="as-title">{{ a.shift?.title || '班次' }}</div>
        <div class="as-row">{{ a.shift?.date }} {{ a.shift?.start_time }} - {{ a.shift?.end_time }}</div>
        <div class="as-row" v-if="a.shift?.location_text">地点：{{ a.shift.location_text }}</div>
        <div class="as-row">
          <el-tag :type="statusType(a.status)" size="small">{{ statusLabel(a.status) }}</el-tag>
        </div>
        <el-button
          v-if="a.status === 'assigned'"
          type="primary"
          size="small"
          style="margin-top:8px"
          :loading="checkingId === a.id"
          @click="onCheckin(a)"
        >签到</el-button>
        <el-tag v-else-if="a.status === 'checked_in'" type="success" style="margin-top:8px">已签到</el-tag>
      </el-card>
    </div>
    <el-empty v-else description="今日无班次" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useAssignmentStore } from '../stores/assignments'
import { usePointsStore } from '../stores/points'

const auth = useAuthStore()
const assignmentStore = useAssignmentStore()
const points = usePointsStore()

const today = new Date().toISOString().slice(0, 10)
const checkingId = ref(0)

const STATUS_MAP = {
  assigned: { label: '待签到', type: 'warning' },
  checked_in: { label: '已签到', type: 'primary' },
  confirmed: { label: '已完成', type: 'success' },
  absent: { label: '缺席', type: 'danger' },
}
const statusLabel = (s) => STATUS_MAP[s]?.label || s || '-'
const statusType = (s) => STATUS_MAP[s]?.type || 'info'

const todayAssignments = computed(() =>
  assignmentStore.list.filter((a) => a.shift?.date === today && a.user_id === auth.user?.id)
)

onMounted(async () => {
  try {
    await points.loadMe()
  } catch (_) {}
  try {
    await assignmentStore.load({ user_id: auth.user?.id, from: today, to: today })
  } catch (_) {}
})

async function onCheckin(a) {
  checkingId.value = a.id
  try {
    await assignmentStore.checkin(a.id)
    ElMessage.success('签到成功')
  } catch (e) {
    // handled
  } finally {
    checkingId.value = 0
  }
}
</script>

<style scoped>
.as-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
.as-row { color: #606266; font-size: 14px; margin: 2px 0; }
</style>
