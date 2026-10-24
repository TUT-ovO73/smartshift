<template>
  <el-card class="shift-card" shadow="hover">
    <div class="title-row">
      <span class="title">{{ shift.title }}</span>
      <el-tag v-if="shift.is_special" type="warning" size="small">特殊</el-tag>
      <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
    </div>
    <div class="row"><el-icon><Calendar /></el-icon> {{ shift.date }}</div>
    <div class="row"><el-icon><Clock /></el-icon> {{ shift.start_time }} - {{ shift.end_time }}</div>
    <div class="row" v-if="shift.location_text"><el-icon><Location /></el-icon> {{ shift.location_text }}</div>
    <div class="row">需 {{ shift.required_count }} 人</div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Clock, Location } from '@element-plus/icons-vue'

const props = defineProps({ shift: { type: Object, required: true } })

const STATUS_MAP = {
  draft: { label: '草稿', type: 'info' },
  published: { label: '已发布', type: 'success' },
  cancelled: { label: '已取消', type: 'danger' },
  finished: { label: '已结束', type: 'info' },
}

const statusLabel = computed(() => STATUS_MAP[props.shift.status]?.label || props.shift.status || '-')
const statusType = computed(() => STATUS_MAP[props.shift.status]?.type || 'info')
</script>

<style scoped>
.shift-card .title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.shift-card .title { font-weight: 600; font-size: 16px; }
.shift-card .row { display: flex; align-items: center; gap: 6px; color: #606266; font-size: 14px; margin-top: 4px; }
</style>
