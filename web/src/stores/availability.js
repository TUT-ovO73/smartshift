import { defineStore } from 'pinia'
import { availabilityApi } from '../api'

export const useAvailabilityStore = defineStore('availability', {
  state: () => ({ list: [] }),
  actions: {
    async load(params) {
      const res = await availabilityApi.get(params)
      this.list = res.availability
      return this.list
    },
    async save(data) {
      await availabilityApi.save(data)
      const idx = this.list.findIndex((a) => a.date === data.date)
      if (idx >= 0) {
        this.list[idx].unavailable_slots = data.unavailable_slots
        this.list[idx].preferred_shift_type = data.preferred_shift_type
      } else {
        this.list.push({ date: data.date, unavailable_slots: data.unavailable_slots, preferred_shift_type: data.preferred_shift_type })
      }
    },
  },
})
