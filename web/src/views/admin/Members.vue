<template>
  <div class="page">
    <h2>成员管理</h2>
    <div style="margin-bottom:12px">
      <el-button type="primary" @click="openInvite">邀请成员</el-button>
    </div>
    <el-table :data="team.members" border v-loading="loading">
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column label="角色" width="140">
        <template #default="{ row }">
          <el-tag size="small">{{ ROLE_MAP[row.role_in_team] || row.role_in_team || '成员' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="credit" label="信用" width="100" />
      <el-table-column prop="points_balance" label="积分" width="100" />
      <el-table-column prop="manual_weight" label="手动权重" width="100" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onRemove(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="编辑成员" width="420px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="角色">
          <el-select v-model="editForm.role_in_team" style="width:100%">
            <el-option label="普通成员" value="member" />
            <el-option label="排班管理员" value="schedule_admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用">
          <el-input-number v-model="editForm.credit" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="手动权重">
          <el-input-number v-model="editForm.manual_weight" :min="-20" :max="20" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="inviteVisible" title="邀请成员" width="420px">
      <el-form label-width="100px">
        <el-form-item label="选择用户">
          <el-select v-model="inviteForm.user_id" filterable placeholder="选择用户" style="width:100%">
            <el-option
              v-for="u in allUsers"
              :key="u.id"
              :label="`${u.name || u.username} (${u.username})`"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="inviteForm.role_in_team" style="width:100%">
            <el-option label="普通成员" value="member" />
            <el-option label="排班管理员" value="schedule_admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onInvite">邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTeamStore } from '../../stores/team'
import { userApi } from '../../api'

const team = useTeamStore()
const loading = ref(false)
const saving = ref(false)
const allUsers = ref([])

const ROLE_MAP = {
  super_admin: '超级管理员',
  schedule_admin: '排班管理员',
  member: '普通成员',
}

const editVisible = ref(false)
const editForm = reactive({ id: null, role_in_team: 'member', credit: 0, manual_weight: 0 })

const inviteVisible = ref(false)
const inviteForm = reactive({ user_id: null, role_in_team: 'member' })

function openEdit(row) {
  editForm.id = row.user_id || row.id
  editForm.role_in_team = row.role_in_team || 'member'
  editForm.credit = row.credit ?? 0
  editForm.manual_weight = row.manual_weight ?? 0
  editVisible.value = true
}

function openInvite() {
  inviteForm.user_id = null
  inviteForm.role_in_team = 'member'
  inviteVisible.value = true
  loadAllUsers()
}

async function loadAllUsers() {
  try {
    const res = await userApi.list()
    allUsers.value = res.users || []
  } catch (_) {}
}

async function onSaveEdit() {
  if (!team.currentTeam || !editForm.id) return
  saving.value = true
  try {
    await team.updateMember(team.currentTeam.id, editForm.id, {
      role_in_team: editForm.role_in_team,
      credit: editForm.credit,
      manual_weight: editForm.manual_weight,
    })
    ElMessage.success('保存成功')
    editVisible.value = false
  } catch (e) {} finally {
    saving.value = false
  }
}

async function onInvite() {
  if (!team.currentTeam || !inviteForm.user_id) {
    ElMessage.warning('请选择用户')
    return
  }
  saving.value = true
  try {
    await team.addMember(team.currentTeam.id, {
      user_id: inviteForm.user_id,
      role_in_team: inviteForm.role_in_team,
    })
    ElMessage.success('邀请成功')
    inviteVisible.value = false
  } catch (e) {} finally {
    saving.value = false
  }
}

async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`确认移除 ${row.name || row.username}?`, '提示', { type: 'warning' })
  } catch (_) { return }
  try {
    await team.removeMember(team.currentTeam.id, row.user_id || row.id)
    ElMessage.success('已移除')
  } catch (e) {}
}

onMounted(async () => {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (!team.currentTeam) return
  loading.value = true
  try {
    await team.loadMembers(team.currentTeam.id)
    await loadAllUsers()
  } catch (_) {} finally {
    loading.value = false
  }
})
</script>
