<template>
  <div class="page">
    <h2>排班日历</h2>
    <div style="margin-bottom:12px">
      <el-button @click="prevMonth">上一月</el-button>
      <el-button @click="nextMonth">下一月</el-button>
      <span style="margin-left:12px">{{ currentLabel }}</span>
    </div>
    <el-calendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div class="cell">
          <div class="date-num">{{ data.day.split('-').slice(2).join('-') }}</div>
          <div v-for="s in shiftsOfDay(data.day)" :key="s.id" class="shift-item">
            <el-tag size="small" :type="s.is_special ? 'warning' : 'primary'">
              {{ s.title }}
            </el-tag>
            <span class="time">{{ s.start_time }}-{{ s.end_time }}</span>
          </div>
        </div>
      </template>
    </el-calendar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '../stores/team'
import { useShiftStore } from '../stores/shifts'

const team = useTeamStore()
const shiftStore = useShiftStore()

const currentDate = ref(new Date())

const currentLabel = computed(() => {
  const d = currentDate.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

function monthRange(date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(y, m + 1, 1)
  const to = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`
  return { from, to }
}

async function loadCurrent() {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (!team.currentTeam) return
  const { from, to } = monthRange(currentDate.value)
  try {
    await shiftStore.load(team.currentTeam.id, from, to)
  } catch (_) {}
}

function shiftsOfDay(dayStr) {
  return shiftStore.list.filter((s) => s.date === dayStr)
}

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
  loadCurrent()
}
function nextMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
  loadCurrent()
}

onMounted(loadCurrent)
</script>

<style scoped>
.cell { height: 100%; }
.date-num { font-weight: 600; }
.shift-item { margin-top: 4px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.shift-item .time { font-size: 11px; color: #909399; }
</style>
