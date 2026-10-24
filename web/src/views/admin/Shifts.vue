<template>
  <div class="page">
    <h2>班次管理</h2>
    <div style="margin-bottom:12px; display:flex; gap:12px; align-items:center">
      <el-date-picker
        v-model="range"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="-"
        start-placeholder="开始"
        end-placeholder="结束"
        @change="loadList"
      />
      <el-button type="primary" @click="openCreate">新建班次</el-button>
    </div>
    <el-table :data="shiftStore.list" border v-loading="loading">
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column label="时间" width="140">
        <template #default="{ row }">{{ row.start_time }} - {{ row.end_time }}</template>
      </el-table-column>
      <el-table-column prop="location_text" label="地点" min-width="120" />
      <el-table-column prop="required_count" label="需求人数" width="100" />
      <el-table-column label="特殊" width="80">
        <template #default="{ row }">
          <el-switch
            :model-value="!!row.is_special"
            @change="(v) => onToggleSpecial(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑班次' : '新建班次'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间"><el-input v-model="form.start_time" placeholder="如 08:00" /></el-form-item>
        <el-form-item label="结束时间"><el-input v-model="form.end_time" placeholder="如 12:00" /></el-form-item>
        <el-form-item label="地点"><el-input v-model="form.location_text" /></el-form-item>
        <el-form-item label="需求人数"><el-input-number v-model="form.required_count" :min="1" /></el-form-item>
        <el-form-item label="特殊班次"><el-switch v-model="form.is_special" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTeamStore } from '../../stores/team'
import { useShiftStore } from '../../stores/shifts'

const team = useTeamStore()
const shiftStore = useShiftStore()
const loading = ref(false)
const saving = ref(false)
const range = ref([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null,
  title: '',
  date: new Date().toISOString().slice(0, 10),
  start_time: '08:00',
  end_time: '12:00',
  location_text: '',
  required_count: 1,
  is_special: false,
  status: 'draft',
})

const STATUS_MAP = {
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  finished: { label: '已结束', type: 'info' },
}
const statusLabel = (s) => STATUS_MAP[s]?.label || s || '-'
const statusType = (s) => STATUS_MAP[s]?.type || 'info'

async function loadList() {
  if (!team.currentTeam) {
    try { await team.loadTeams() } catch (_) {}
  }
  if (!team.currentTeam) return
  loading.value = true
  try {
    const from = range.value?.[0]
    const to = range.value?.[1]
    await shiftStore.load(team.currentTeam.id, from, to)
  } catch (_) {} finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.title = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.start_time = '08:00'
  form.end_time = '12:00'
  form.location_text = ''
  form.required_count = 1
  form.is_special = false
  form.status = 'draft'
}

function openCreate() {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    title: row.title || '',
    date: row.date || '',
    start_time: row.start_time || '',
    end_time: row.end_time || '',
    location_text: row.location_text || '',
    required_count: row.required_count || 1,
    is_special: !!row.is_special,
    status: row.status || 'draft',
  })
  isEdit.value = true
  dialogVisible.value = true
}

async function onSave() {
  if (!team.currentTeam) return
  saving.value = true
  try {
    if (isEdit.value) {
      await shiftStore.update(form.id, { ...form }, team.currentTeam.id)
    } else {
      await shiftStore.create(team.currentTeam.id, { ...form })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
  } catch (e) {} finally {
    saving.value = false
  }
}

async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`确认删除班次 ${row.title}?`, '提示', { type: 'warning' })
  } catch (_) { return }
  try {
    await shiftStore.remove(row.id, team.currentTeam?.id)
    ElMessage.success('已删除')
  } catch (e) {}
}

async function onToggleSpecial(row, v) {
  try {
    await shiftStore.update(row.id, { is_special: v }, team.currentTeam?.id)
    ElMessage.success('已更新')
  } catch (e) {}
}

onMounted(loadList)
</script>
