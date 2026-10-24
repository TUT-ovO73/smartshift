import { defineStore } from 'pinia'
import { scheduleApi } from '../api'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    draft: [],
    conflicts: [],
    generatedAt: null,
    loading: false,
  }),
  actions: {
    async generate(teamId, from, to) {
      this.loading = true
      try {
        const res = await scheduleApi.generate(teamId, { from, to })
        this.draft = res.draft
        this.conflicts = res.conflicts
        this.generatedAt = res.generated_at
        return res
      } finally {
        this.loading = false
      }
    },
    async loadDraft(teamId) {
      const res = await scheduleApi.draft(teamId)
      this.draft = res.draft
      this.conflicts = res.conflicts
      this.generatedAt = res.generated_at
      return res
    },
    async publish(teamId, assignments) {
      const res = await scheduleApi.publish(teamId, assignments)
      this.draft = []
      this.conflicts = []
      return res
    },
    clear() {
      this.draft = []
      this.conflicts = []
      this.generatedAt = null
    },
  },
})
