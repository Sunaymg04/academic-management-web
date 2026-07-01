import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, getAuthToken, getStoredUser, setAuthToken, setStoredUser } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAuthToken())
  const user = ref(getStoredUser())
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(token.value))
  const userName = computed(() => user.value?.name || user.value?.email || 'Usuario')
  const initials = computed(() =>
    userName.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U',
  )
  const permissions = computed(() => user.value?.permissions ?? [])
  const roles = computed(() => user.value?.roles ?? [])

  function hasPermission(...codes) {
    if (!codes.length) return true

    return codes.some((code) => permissions.value.includes(code))
  }

  function setSession(payload) {
    token.value = payload?.access_token ?? null
    user.value = payload?.user ?? null
    setAuthToken(token.value)
    setStoredUser(user.value)
  }

  function clearSession() {
    token.value = null
    user.value = null
    setAuthToken(null)
    setStoredUser(null)
  }

  async function login(credentials) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.post('/auth/login', {
        ...credentials,
        device_name: 'academic-management-web',
      })

      setSession(response.data)

      return { ok: true, user: user.value }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudo iniciar sesion.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return { ok: false }

    try {
      const response = await api.get('/auth/me')

      user.value = response.data?.user
      setStoredUser(user.value)

      return { ok: true, user: user.value }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError) }
    }
  }

  async function logout() {
    try {
      if (token.value) await api.post('/auth/logout')
    } finally {
      clearSession()
    }
  }

  window.addEventListener('academic-management:unauthorized', clearSession)

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    userName,
    initials,
    permissions,
    roles,
    hasPermission,
    login,
    fetchMe,
    logout,
    clearSession,
  }
})
