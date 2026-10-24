import { defineStore } from 'pinia'
import { statsApi } from '../api'

export const useStatsStore = defineStore('stats', {
  state: () => ({ overview: null, leaderboard: [], personal: null, completion: [] }),
  actions: {
    async loadOverview(teamId) {
      const res = await statsApi.overview(teamId)
      this.overview = res.overview
      this.leaderboard = res.leaderboard
      return res
    },
    async loadPersonal(userId) {
      const res = await statsApi.personal(userId)
      this.personal = res.personal
      return res
    },
    async loadCompletion(teamId) {
      const res = await statsApi.completion(teamId)
      this.completion = res.by_date
      return res
    },
  },
})
