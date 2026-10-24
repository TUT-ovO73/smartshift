<template>
  <div class="page">
    <h2>积分规则</h2>

    <el-card style="margin-bottom:20px">
      <template #header>积分 / 信用规则</template>
      <el-table :data="rules" border>
        <el-table-column prop="action" label="行为" min-width="160" />
        <el-table-column label="积分" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.points >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.points > 0 ? '+' + row.points : row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="信用" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.credit >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.credit > 0 ? '+' + row.credit : row.credit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="200" />
      </el-table>
    </el-card>

    <el-card>
      <template #header>手动调整</template>
      <el-form :model="form" label-width="80px" inline>
        <el-form-item label="成员">
          <el-select v-model="form.userId" filterable placeholder="选择成员" style="width:200px">
            <el-option
              v-for="m in team.members"
              :key="m.user_id || m.id"
              :label="m.name || m.username"
              :value="m.user_id || m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变动">
          <el-input-number v-model="form.delta" :min="-100" :max="100" :step="1" />
        </el-form-item>
        <el-form-item label="事由">
          <el-input v-model="form.reason" placeholder="如：手动奖励" style="width:240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onAdjust">提交调整</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTeamStore } from '../../stores/team'
import { pointsApi } from '../../api'

const team = useTeamStore()
const saving = ref(false)
const form = reactive({ userId: null, delta: 10, reason: '' })

const rules = [
  { action: '准时完成班次', points: 10, credit: 0, note: '正常出勤并签到' },
  { action: '特殊班次', points: 5, credit: 0, note: '参与特殊班次额外奖励' },
  { action: '临时顶替', points: 8, credit: 1, note: '替补他人，奖励额外积分与信用' },
  { action: '迟到签到', points: -2, credit: -1, note: '签到时间晚于班次开始' },
  { action: '缺席', points: -5, credit: -5, note: '已分派但未出勤' },
  { action: '连续满勤', points: 15, credit: 2, note: '一周内全部完成' },
]

async function onAdjust() {
  if (!form.userId) {
    ElMessage.warning('请选择成员')
    return
  }
  saving.value = true
  try {
    await pointsApi.adjust(form.userId, form.delta, form.reason || '手动调整')
    ElMessage.success('调整成功')
    form.reason = ''
  } catch (e) {} finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (team.currentTeam) {
    try { await team.loadMembers(team.currentTeam.id) } catch (_) {}
  }
})
</script>
