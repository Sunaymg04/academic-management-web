import { createRouter, createWebHistory } from 'vue-router'
import CertificatesView from '@/views/CertificatesView.vue'
import CoursesView from '@/views/CoursesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import EnrollmentsView from '@/views/EnrollmentsView.vue'
import GradesView from '@/views/GradesView.vue'
import PaymentsView from '@/views/PaymentsView.vue'
import StudentsView from '@/views/StudentsView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'
import { useAuthStore } from '@/stores/auth'

const roles = {
  all: ['admin', 'academic', 'finance', 'teacher', 'student'],
  academic: ['admin', 'academic'],
  finance: ['admin', 'finance'],
  teaching: ['admin', 'academic', 'teacher'],
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { roles: roles.all },
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
      meta: { roles: roles.academic },
    },
    {
      path: '/enrollments',
      name: 'enrollments',
      component: EnrollmentsView,
      meta: { roles: roles.academic },
    },
    {
      path: '/payments',
      name: 'payments',
      component: PaymentsView,
      meta: { roles: roles.finance },
    },
    {
      path: '/courses',
      name: 'courses',
      component: CoursesView,
      meta: { roles: roles.teaching },
    },
    {
      path: '/grades',
      name: 'grades',
      component: GradesView,
      meta: { roles: roles.teaching },
    },
    {
      path: '/certificates',
      name: 'certificates',
      component: CertificatesView,
      meta: { roles: roles.academic },
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView,
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const allowedRoles = to.meta.roles || []

  if (!auth.isAuthenticated && to.name !== 'unauthorized') return '/unauthorized'
  if (!auth.canAccess(allowedRoles) && to.name !== 'unauthorized') return '/unauthorized'

  return true
})

export default router
