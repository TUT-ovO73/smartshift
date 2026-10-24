<template>
  <div class="page">
    <h2>积分中心</h2>
    <div class="card-grid" style="margin-bottom:24px">
      <div class="stat-card">
        <div class="label">积分</div>
        <div class="value">{{ points.balance.points }}</div>
      </div>
      <div class="stat-card">
        <div class="label">信用</div>
        <div class="value">{{ points.balance.credit }}</div>
      </div>
    </div>

    <h3>积分流水</h3>
    <el-table :data="points.ledger" border v-loading="loading">
      <el-table-column prop="created_at" label="时间" min-width="160" />
      <el-table-column prop="reason" label="事由" min-width="160" />
      <el-table-column label="变动" width="120">
        <template #default="{ row }">
          <span :style="{ color: row.delta >= 0 ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
            {{ row.delta > 0 ? '+' + row.delta : row.delta }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { usePointsStore } from '../stores/points'

const points = usePointsStore()
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await points.loadMe()
  } catch (_) {} finally {
    loading.value = false
  }
})
</script>
