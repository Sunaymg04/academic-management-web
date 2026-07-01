import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { setAuthToken } from '@/services/api'

const TOKEN_KEY = 'academic_management_token'
const USER_KEY = 'academic_management_user'

const roleLabels = {
  admin: 'Administradora',
  academic: 'Analista Academica',
  finance: 'Analista Financiera',
  teacher: 'Docente',
  student: 'Estudiante',
}

function safeJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function defaultUser() {
  const role = import.meta.env.VITE_DEFAULT_USER_ROLE || 'admin'

  return {
    name: import.meta.env.VITE_DEFAULT_USER_NAME || 'Usuario Academico',
    role,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(safeJson(localStorage.getItem(USER_KEY)) || defaultUser())
  const authRequired = import.meta.env.VITE_AUTH_REQUIRED === 'true'

  const isAuthenticated = computed(() => Boolean(token.value) || !authRequired)
  const role = computed(() => user.value?.role || 'guest')
  const roleLabel = computed(() => roleLabels[role.value] || role.value)

  function canAccess(allowedRoles = []) {
    if (!allowedRoles.length) return true
    return allowedRoles.includes(role.value)
  }

  function setSession(nextToken, nextUser = user.value) {
    token.value = nextToken || ''
    user.value = nextUser || defaultUser()
    setAuthToken(token.value)

    if (token.value) {
      localStorage.setItem(TOKEN_KEY, token.value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  function clearSession() {
    setSession('', defaultUser())
  }

  return {
    token,
    user,
    role,
    roleLabel,
    authRequired,
    isAuthenticated,
    canAccess,
    setSession,
    clearSession,
  }
})
