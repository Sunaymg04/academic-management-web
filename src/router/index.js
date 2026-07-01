import { createRouter, createWebHistory } from 'vue-router'
import EnrollmentsView from '@/views/EnrollmentsView.vue'
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
  ],
})

export default router
