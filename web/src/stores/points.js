import { defineStore } from 'pinia'
import { pointsApi } from '../api'

export const usePointsStore = defineStore('points', {
  state: () => ({ balance: { points: 0, credit: 0 }, ledger: [] }),
  actions: {
    async loadMe() {
      const res = await pointsApi.me()
      this.balance = res.balance
      this.ledger = res.ledger
      return res
    },
    async loadUser(userId) {
      const res = await pointsApi.user(userId)
      this.balance = res.balance
      this.ledger = res.ledger
      return res
    },
    async adjust(userId, delta, reason) {
      await pointsApi.adjust(userId, delta, reason)
      await this.loadUser(userId)
    },
  },
})
