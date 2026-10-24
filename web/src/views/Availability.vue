<template>
  <div class="page">
    <h2>可用时间</h2>
    <el-form label-width="120px">
      <el-form-item label="日期">
        <el-date-picker
          v-model="date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          @change="onDateChange"
        />
      </el-form-item>

      <el-form-item label="不可用时段">
        <el-checkbox-group v-model="form.unavailable_slots">
          <el-checkbox v-for="s in slots" :key="s.value" :label="s.value">{{ s.label }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="偏好班次">
        <el-radio-group v-model="form.preferred_shift_type">
          <el-radio label="morning">早班</el-radio>
          <el-radio label="evening">晚班</el-radio>
          <el-radio label="night">夜班</el-radio>
          <el-radio label="any">均可</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAvailabilityStore } from '../stores/availability'

const availabilityStore = useAvailabilityStore()

const slots = [
  { label: '00:00-06:00', value: '00:00-06:00' },
  { label: '06:00-08:00', value: '06:00-08:00' },
  { label: '08:00-12:00', value: '08:00-12:00' },
  { label: '12:00-14:00', value: '12:00-14:00' },
  { label: '14:00-18:00', value: '14:00-18:00' },
  { label: '18:00-22:00', value: '18:00-22:00' },
  { label: '22:00-24:00', value: '22:00-24:00' },
]

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const form = reactive({
  unavailable_slots: [],
  preferred_shift_type: 'any',
})
const saving = ref(false)

async function loadDate() {
  if (!date.value) return
  try {
    await availabilityStore.load({ date: date.value })
    const item = availabilityStore.list.find((a) => a.date === date.value)
    form.unavailable_slots = item?.unavailable_slots ? [...item.unavailable_slots] : []
    form.preferred_shift_type = item?.preferred_shift_type || 'any'
  } catch (_) {}
}

function onDateChange() {
  loadDate()
}

async function onSave() {
  saving.value = true
  try {
    await availabilityStore.save({
      date: date.value,
      unavailable_slots: form.unavailable_slots,
      preferred_shift_type: form.preferred_shift_type,
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // handled
  } finally {
    saving.value = false
  }
}

onMounted(loadDate)
watch(date, loadDate)
</script>
