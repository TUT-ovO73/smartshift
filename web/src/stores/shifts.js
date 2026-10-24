import { defineStore } from 'pinia'
import { shiftApi } from '../api'

export const useShiftStore = defineStore('shifts', {
  state: () => ({ list: [] }),
  actions: {
    async load(teamId, from, to) {
      const res = await shiftApi.list(teamId, from, to)
      this.list = res.shifts
      return this.list
    },
    async create(teamId, data) {
      await shiftApi.create(teamId, data)
      await this.load(teamId)
    },
    async update(id, data, teamId) {
      await shiftApi.update(id, data)
      if (teamId) await this.load(teamId)
    },
    async remove(id, teamId) {
      await shiftApi.remove(id)
      if (teamId) await this.load(teamId)
    },
  },
})
