<template>
  <div class="page">
    <h2>签到</h2>

    <h3>我的班次</h3>
    <el-table :data="myAssignments" border v-loading="loadingMine">
      <el-table-column prop="title" label="班次" min-width="120" />
      <el-table-column label="日期">
        <template #default="{ row }">{{ row.date }}</template>
      </el-table-column>
      <el-table-column label="时间">
        <template #default="{ row }">{{ row.start_time }} - {{ row.end_time }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'assigned'"
            type="primary"
            size="small"
            :loading="actingId === row.id"
            @click="onCheckin(row)"
          >签到</el-button>
          <el-tag v-else-if="row.status === 'checked_in'" type="success" size="small">已签到</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <template v-if="auth.isAdmin">
      <h3 style="margin-top:24px">团队班次管理</h3>
      <el-table :data="teamAssignments" border v-loading="loadingTeam">
        <el-table-column prop="name" label="成员" min-width="100">
          <template #default="{ row }">{{ row.name || row.username }}</template>
        </el-table-column>
        <el-table-column prop="title" label="班次" min-width="120" />
        <el-table-column label="时间">
          <template #default="{ row }">{{ row.date }} {{ row.start_time }}-{{ row.end_time }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'checked_in'"
              type="success"
              size="small"
              :loading="actingId === row.id"
              @click="onConfirm(row)"
            >确认</el-button>
            <el-button
              v-if="row.status !== 'absent' && row.status !== 'confirmed'"
              type="danger"
              size="small"
              :loading="actingId === row.id"
              @click="onAbsent(row)"
            >缺席</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useTeamStore } from '../stores/team'
import { useAssignmentStore } from '../stores/assignments'

const auth = useAuthStore()
const team = useTeamStore()
const assignmentStore = useAssignmentStore()

const loadingMine = ref(false)
const loadingTeam = ref(false)
const actingId = ref(0)

const STATUS_MAP = {
  assigned: { label: '待签到', type: 'warning' },
  checked_in: { label: '已签到', type: 'primary' },
  confirmed: { label: '已完成', type: 'success' },
  absent: { label: '缺席', type: 'danger' },
}
const statusLabel = (s) => STATUS_MAP[s]?.label || s || '-'
const statusType = (s) => STATUS_MAP[s]?.type || 'info'

const myAssignments = computed(() =>
  assignmentStore.list.filter((a) => a.user_id === auth.user?.id)
)
const teamAssignments = computed(() => assignmentStore.list)

async function loadMine() {
  loadingMine.value = true
  try {
    await assignmentStore.load({ user_id: auth.user?.id })
  } catch (_) {} finally {
    loadingMine.value = false
  }
}

async function loadTeam() {
  if (!auth.isAdmin) return
  loadingTeam.value = true
  try {
    if (!team.currentTeam) await team.loadTeams()
    await assignmentStore.load({ team_id: team.currentTeam?.id })
  } catch (_) {} finally {
    loadingTeam.value = false
  }
}

async function onCheckin(row) {
  actingId.value = row.id
  try {
    await assignmentStore.checkin(row.id)
    ElMessage.success('签到成功')
  } catch (e) {} finally {
    actingId.value = 0
  }
}

async function onConfirm(row) {
  actingId.value = row.id
  try {
    await assignmentStore.confirm(row.id)
    ElMessage.success('已确认完成')
  } catch (e) {} finally {
    actingId.value = 0
  }
}

async function onAbsent(row) {
  actingId.value = row.id
  try {
    await assignmentStore.absent(row.id)
    ElMessage.success('已标记缺席')
  } catch (e) {} finally {
    actingId.value = 0
  }
}

onMounted(async () => {
  await loadMine()
  await loadTeam()
})
</script>
