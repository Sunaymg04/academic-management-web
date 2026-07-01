import { createRouter, createWebHistory } from 'vue-router'
import CoursesView from '@/views/CoursesView.vue'
import EnrollmentsView from '@/views/EnrollmentsView.vue'
import GradesView from '@/views/GradesView.vue'
import PaymentsView from '@/views/PaymentsView.vue'
import StudentsView from '@/views/StudentsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/students',
    },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
    },
    {
      path: '/enrollments',
      name: 'enrollments',
      component: EnrollmentsView,
    },
    {
      path: '/payments',
      name: 'payments',
      component: PaymentsView,
    },
    {
      path: '/courses',
      name: 'courses',
      component: CoursesView,
    },
    {
      path: '/grades',
      name: 'grades',
      component: GradesView,
    },
  ],
})

export default router
