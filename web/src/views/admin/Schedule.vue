<template>
  <div class="page">
    <h2>智能排班</h2>
    <div style="display:flex; gap:12px; align-items:center; margin-bottom:16px">
      <el-date-picker v-model="from" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
      <el-date-picker v-model="to" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
      <el-button type="primary" :loading="schedule.loading" @click="onGenerate">一键生成</el-button>
      <el-button type="success" :loading="publishing" :disabled="!draft.length" @click="onPublish">确认发布</el-button>
    </div>

    <ConflictList :conflicts="schedule.conflicts" />

    <div v-for="(item, idx) in draft" :key="idx" class="draft-block">
      <div class="draft-title">
        {{ item.shift?.title || '班次' }} · {{ item.shift?.date }} {{ item.shift?.start_time }}-{{ item.shift?.end_time }}
        (需 {{ item.shift?.required_count }} 人，已选 {{ item.assignments?.length || 0 }})
      </div>
      <el-table :data="item.assignments || []" border size="small">
        <el-table-column label="成员" min-width="120">
          <template #default="{ row }">
            {{ row.user?.name || row.user?.username || ('#' + row.user_id) }}
          </template>
        </el-table-column>
        <el-table-column label="评分" width="200">
          <template #default="{ row }">
            <ScoreBar :score="row.score" :max="100" />
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="180">
          <template #default="{ row }">
            <el-popover
              v-if="row.reason && row.reason.length"
              trigger="click"
              :width="320"
              placement="left"
            >
              <template #reference>
                <el-button size="small" link>查看原因</el-button>
              </template>
              <AssignmentReason :reason="row.reason" />
            </el-popover>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="更换成员" width="220">
          <template #default="{ row, $index }">
            <el-select
              :model-value="row.user_id"
              filterable
              size="small"
              placeholder="更换成员"
              @change="(v) => onSwap(item, $index, v)"
            >
              <el-option
                v-for="m in members"
                :key="m.user_id || m.id"
                :label="m.name || m.username"
                :value="m.user_id || m.id"
              />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-if="!draft.length && !schedule.loading" description="暂无草稿，点击一键生成" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTeamStore } from '../../stores/team'
import { useScheduleStore } from '../../stores/schedule'
import ConflictList from '../../components/ConflictList.vue'
import ScoreBar from '../../components/ScoreBar.vue'
import AssignmentReason from '../../components/AssignmentReason.vue'

const team = useTeamStore()
const schedule = useScheduleStore()
const publishing = ref(false)

const today = new Date().toISOString().slice(0, 10)
const from = ref(today)
const to = ref(today)

const draft = computed(() => schedule.draft || [])
const members = computed(() => team.members || [])

async function onGenerate() {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (!team.currentTeam) {
    ElMessage.warning('未选择团队')
    return
  }
  if (!from.value || !to.value) {
    ElMessage.warning('请选择日期范围')
    return
  }
  try {
    await schedule.generate(team.currentTeam.id, from.value, to.value)
    ElMessage.success('生成完成')
  } catch (e) {}
}

async function onPublish() {
  if (!team.currentTeam) return
  const payload = []
  for (const item of draft.value) {
    for (const a of item.assignments || []) {
      payload.push({
        shift_id: item.shift?.id || a.shift_id,
        user_id: a.user_id,
        score: a.score,
        reason: a.reason || [],
      })
    }
  }
  if (!payload.length) {
    ElMessage.warning('无可发布的排班')
    return
  }
  publishing.value = true
  try {
    await schedule.publish(team.currentTeam.id, payload)
    ElMessage.success('已发布')
  } catch (e) {} finally {
    publishing.value = false
  }
}

function onSwap(item, idx, newUserId) {
  const a = item.assignments[idx]
  const m = members.value.find((x) => (x.user_id || x.id) === newUserId)
  item.assignments[idx] = {
    ...a,
    user_id: newUserId,
    user: m ? { name: m.name, username: m.username } : a.user,
  }
}

onMounted(async () => {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (team.currentTeam) {
    try { await team.loadMembers(team.currentTeam.id) } catch (_) {}
    try { await schedule.loadDraft(team.currentTeam.id) } catch (_) {}
  }
})
</script>

<style scoped>
.draft-block { background: #fff; border-radius: 8px; padding: 16px; margin-top: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.draft-title { font-weight: 600; margin-bottom: 8px; }
</style>
