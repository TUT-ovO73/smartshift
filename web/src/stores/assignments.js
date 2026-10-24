import { defineStore } from 'pinia'
import { assignmentApi, checkinApi } from '../api'

export const useAssignmentStore = defineStore('assignments', {
  state: () => ({ list: [] }),
  actions: {
    async load(params) {
      const res = await assignmentApi.list(params)
      this.list = res.assignments
      return this.list
    },
    async checkin(id, method = 'button') {
      const res = await checkinApi.checkin(id, method)
      const idx = this.list.findIndex((a) => a.id === id)
      if (idx >= 0) Object.assign(this.list[idx], res.assignment)
      return res
    },
    async confirm(id) {
      const res = await checkinApi.confirm(id)
      const item = this.list.find((a) => a.id === id)
      if (item) item.status = 'confirmed'
      return res
    },
    async absent(id) {
      const res = await checkinApi.absent(id)
      const item = this.list.find((a) => a.id === id)
      if (item) item.status = 'absent'
      return res
    },
    async swap(id, data) {
      const res = await assignmentApi.update(id, data)
      const idx = this.list.findIndex((a) => a.id === id)
      if (idx >= 0) Object.assign(this.list[idx], res.assignment)
      return res
    },
  },
})
