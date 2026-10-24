import http from './http'

// Auth
export const authApi = {
  login: (data) => http.post('/auth/login', data),
  me: () => http.get('/auth/me'),
}

// Users
export const userApi = {
  list: () => http.get('/users'),
  get: (id) => http.get(`/users/${id}`),
  create: (data) => http.post('/users', data),
  update: (id, data) => http.patch(`/users/${id}`, data),
  remove: (id) => http.delete(`/users/${id}`),
}

// Teams
export const teamApi = {
  list: () => http.get('/teams'),
  get: (id) => http.get(`/teams/${id}`),
  create: (data) => http.post('/teams', data),
  members: (id) => http.get(`/teams/${id}/members`),
  addMember: (id, data) => http.post(`/teams/${id}/members`, data),
  updateMember: (id, memberId, data) => http.patch(`/teams/${id}/members/${memberId}`, data),
  removeMember: (id, memberId) => http.delete(`/teams/${id}/members/${memberId}`),
}

// Shifts
export const shiftApi = {
  list: (teamId, from, to) => http.get(`/teams/${teamId}/shifts`, { params: { from, to } }),
  create: (teamId, data) => http.post(`/teams/${teamId}/shifts`, data),
  get: (id) => http.get(`/shifts/${id}`),
  update: (id, data) => http.patch(`/shifts/${id}`, data),
  remove: (id) => http.delete(`/shifts/${id}`),
}

// Availability
export const availabilityApi = {
  get: (params) => http.get('/availability', { params }),
  save: (data) => http.put('/availability', data),
  saveBatch: (items) => http.put('/availability/batch', { items }),
}

// Assignments
export const assignmentApi = {
  list: (params) => http.get('/assignments', { params }),
  get: (id) => http.get(`/assignments/${id}`),
  update: (id, data) => http.patch(`/assignments/${id}`, data),
  remove: (id) => http.delete(`/assignments/${id}`),
}

// Scheduling
export const scheduleApi = {
  generate: (teamId, data) => http.post(`/teams/${teamId}/schedule/generate`, data),
  draft: (teamId) => http.get(`/teams/${teamId}/schedule/draft`),
  publish: (teamId, assignments) => http.post(`/teams/${teamId}/schedule/publish`, { assignments }),
}

// Checkin
export const checkinApi = {
  checkin: (id, method = 'button') => http.post(`/assignments/${id}/checkin`, { method }),
  confirm: (id) => http.post(`/assignments/${id}/confirm`),
  absent: (id) => http.post(`/assignments/${id}/absent`),
}

// Points
export const pointsApi = {
  me: () => http.get('/users/me/points'),
  user: (id) => http.get(`/users/${id}/points`),
  adjust: (id, delta, reason) => http.post(`/users/${id}/points/adjust`, { delta, reason }),
  teamLedger: (teamId, limit) => http.get(`/teams/${teamId}/points/ledger`, { params: { limit } }),
}

// Stats
export const statsApi = {
  overview: (teamId) => http.get(`/teams/${teamId}/stats/overview`),
  personal: (userId) => http.get(`/users/${userId}/stats/personal`),
  completion: (teamId) => http.get(`/teams/${teamId}/stats/completion`),
}
