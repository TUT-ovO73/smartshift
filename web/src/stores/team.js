import { defineStore } from 'pinia'
import { teamApi } from '../api'

export const useTeamStore = defineStore('team', {
  state: () => ({
    teams: [],
    currentTeam: null,
    members: [],
  }),
  actions: {
    async loadTeams() {
      const res = await teamApi.list()
      this.teams = res.teams
      if (!this.currentTeam && this.teams.length) this.currentTeam = this.teams[0]
      return this.teams
    },
    async loadMembers(teamId) {
      const res = await teamApi.members(teamId)
      this.members = res.members
      return this.members
    },
    async addMember(teamId, data) {
      await teamApi.addMember(teamId, data)
      await this.loadMembers(teamId)
    },
    async updateMember(teamId, memberId, data) {
      await teamApi.updateMember(teamId, memberId, data)
      await this.loadMembers(teamId)
    },
    async removeMember(teamId, memberId) {
      await teamApi.removeMember(teamId, memberId)
      await this.loadMembers(teamId)
    },
  },
})
