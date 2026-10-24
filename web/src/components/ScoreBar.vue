<template>
  <div class="score-bar">
    <div class="score-bar-track">
      <div class="score-bar-fill" :style="{ width: fillWidth }"></div>
    </div>
    <span class="score-text">{{ score }} / {{ max }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
})

const fillWidth = computed(() => {
  if (!props.max) return '0%'
  const pct = (Number(props.score) / props.max) * 100
  return `${Math.min(Math.max(pct, 0), 100)}%`
})
</script>

<style scoped>
.score-bar { display: flex; align-items: center; gap: 8px; }
.score-bar-track { flex: 1; min-width: 80px; }
.score-text { font-size: 12px; color: #606266; white-space: nowrap; }
</style>
