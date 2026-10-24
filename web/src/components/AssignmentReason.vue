<template>
  <div class="reason-list">
    <el-tooltip
      v-for="(r, i) in reasons"
      :key="i"
      :content="r.detail || r.factor || ''"
      placement="top"
    >
      <span class="reason-tag" :class="tagClass(r)">
        {{ r.factor }} {{ formatValue(r.value) }}
      </span>
    </el-tooltip>
  </div>
</template>

<script setup>
const props = defineProps({
  reason: { type: Array, default: () => [] },
})

const reasons = Array.isArray(props.reason) ? props.reason : []

function tagClass(r) {
  const v = Number(r?.value)
  if (v > 0) return 'reason-positive'
  if (v < 0) return 'reason-negative'
  return 'reason-neutral'
}

function formatValue(v) {
  const n = Number(v)
  if (!isFinite(n)) return '0'
  return n > 0 ? `+${n}` : `${n}`
}
</script>

<style scoped>
.reason-list { display: flex; flex-wrap: wrap; align-items: center; }
</style>
