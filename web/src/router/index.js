import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('../views/Home.vue'), meta: { title: '首页' } },
      { path: 'calendar', name: 'calendar', component: () => import('../views/Calendar.vue'), meta: { title: '排班日历' } },
      { path: 'availability', name: 'availability', component: () => import('../views/Availability.vue'), meta: { title: '可用时间' } },
      { path: 'checkin', name: 'checkin', component: () => import('../views/Checkin.vue'), meta: { title: '签到' } },
      { path: 'points', name: 'points', component: () => import('../views/Points.vue'), meta: { title: '积分中心' } },
      { path: 'profile', name: 'profile', component: () => import('../views/Profile.vue'), meta: { title: '我的' } },
    ],
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requireAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'members', name: 'admin-members', component: () => import('../views/admin/Members.vue'), meta: { title: '成员管理' } },
      { path: 'shifts', name: 'admin-shifts', component: () => import('../views/admin/Shifts.vue'), meta: { title: '班次管理' } },
      { path: 'schedule', name: 'admin-schedule', component: () => import('../views/admin/Schedule.vue'), meta: { title: '智能排班' } },
      { path: 'points-rules', name: 'admin-points-rules', component: () => import('../views/admin/PointsRules.vue'), meta: { title: '积分规则' } },
      { path: 'stats', name: 'admin-stats', component: () => import('../views/admin/Stats.vue'), meta: { title: '统计报表' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.name !== 'login' && !auth.token) {
    return { name: 'login' }
  }
  if (to.meta.requireAdmin && !['super_admin', 'schedule_admin'].includes(auth.user?.role)) {
    return { name: 'home' }
  }
})

export default router
