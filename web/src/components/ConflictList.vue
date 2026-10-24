<template>
  <el-alert
    v-if="conflicts && conflicts.length"
    type="warning"
    :closable="false"
    show-icon
    title="冲突提示"
  >
    <div v-for="(c, i) in conflicts" :key="i" class="conflict-item">
      {{ c.date }} {{ c.start_time }}-{{ c.end_time }} {{ c.title }}: 缺口 {{ c.gap }} 人
    </div>
  </el-alert>
</template>

<script setup>
const props = defineProps({
  conflicts: { type: Array, default: () => [] },
})
</script>

<style scoped>
.conflict-item { line-height: 1.6; }
</style>
