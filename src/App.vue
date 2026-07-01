<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Bell, ChevronDown, Languages, LogOut, Moon, Sun } from '@lucide/vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useCertificatesStore } from '@/stores/certificates'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useGradesStore } from '@/stores/grades'
import { usePaymentsStore } from '@/stores/payments'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const authStore = useAuthStore()
const studentsStore = useStudentsStore()
const enrollmentsStore = useEnrollmentsStore()
const paymentsStore = usePaymentsStore()
const coursesStore = useCoursesStore()
const gradesStore = useGradesStore()
const certificatesStore = useCertificatesStore()

const labels = {
  es: {
    role: 'Analista Académica',
    language: 'Idioma',
    theme: 'Tema',
    notifications: 'Notificaciones',
    email: 'Correo',
    password: 'Contrasena',
    login: 'Entrar',
    logout: 'Salir',
    demo: 'Usa admin@example.edu / password con la data demo del backend.',
  },
  en: {
    role: 'Academic Analyst',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    email: 'Email',
    password: 'Password',
    login: 'Sign in',
    logout: 'Sign out',
    demo: 'Use admin@example.edu / password with the backend demo data.',
  },
}

const loginForm = reactive({
  email: 'admin@example.edu',
  password: 'password',
})
const loginFeedback = ref('')
const bootstrapped = ref(false)
const userRole = computed(() => authStore.roles[0] || t('role'))

function t(key) {
  return labels[ui.language][key]
}

async function loadInitialData() {
  if (!authStore.isAuthenticated) return

  await Promise.allSettled([studentsStore.fetchStudents(), enrollmentsStore.fetchCatalogs()])
  await Promise.allSettled([
    enrollmentsStore.fetchEnrollments(),
    paymentsStore.fetchPayments(),
    coursesStore.fetchTeachers(),
    coursesStore.fetchCourses(),
    gradesStore.fetchGrades(),
    certificatesStore.fetchCertificates(),
  ])
}

async function submitLogin() {
  const result = await authStore.login({ ...loginForm })

  loginFeedback.value = result.ok ? '' : result.message
  if (result.ok) await loadInitialData()
}

async function logout() {
  await authStore.logout()
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.fetchMe()
    await loadInitialData()
  }

  bootstrapped.value = true
})

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) bootstrapped.value = true
  },
)
</script>

<template>
  <section v-if="!authStore.isAuthenticated" class="login-screen">
    <form class="login-panel" @submit.prevent="submitLogin">
      <div class="login-brand">
        <strong>Academic Management</strong>
        <span>{{ t('demo') }}</span>
      </div>

      <label>
        {{ t('email') }}
        <input v-model.trim="loginForm.email" type="email" autocomplete="username" required />
      </label>

      <label>
        {{ t('password') }}
        <input v-model="loginForm.password" type="password" autocomplete="current-password" required />
      </label>

      <p aria-live="polite">{{ loginFeedback || authStore.error }}</p>

      <button type="submit" class="primary-action" :disabled="authStore.loading">
        {{ t('login') }}
      </button>
    </form>
  </section>

  <div v-else class="app-shell" :class="{ 'sidebar-collapsed': ui.sidebarCollapsed }">
    <AppSidebar />

    <div class="main-column">
      <header class="topbar">
        <div class="topbar-actions">
          <label class="control-chip" :title="t('language')">
            <Languages :size="18" />
            <select v-model="ui.language" :aria-label="t('language')">
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>

          <button type="button" class="icon-button" :title="t('theme')" @click="ui.toggleTheme">
            <Sun v-if="ui.isDark" :size="19" />
            <Moon v-else :size="19" />
          </button>

          <button type="button" class="notification-button" :aria-label="t('notifications')">
            <Bell :size="22" />
            <span>3</span>
          </button>
        </div>

        <div class="user-card">
          <span class="avatar">{{ authStore.initials }}</span>
          <div>
            <strong>{{ authStore.userName }}</strong>
            <small>{{ userRole }}</small>
          </div>
          <ChevronDown :size="18" />
          <button type="button" class="icon-button" :title="t('logout')" @click="logout">
            <LogOut :size="18" />
          </button>
        </div>
      </header>

      <main class="workspace">
        <RouterView v-if="bootstrapped" />
      </main>
    </div>
  </div>
</template>

<style>
:root {
  color: #0d1633;
  background: #f5f8fc;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --bg: #f5f8fc;
  --panel: #ffffff;
  --panel-soft: #f8fbff;
  --text: #0d1633;
  --muted: #5d6984;
  --line: #dbe4f0;
  --primary: #0969ee;
  --primary-soft: #e9f2ff;
  --success: #20b15a;
  --warning: #ff9f1c;
  --danger: #ff5757;
  --shadow: 0 14px 38px rgba(18, 35, 72, 0.1);
  --sidebar-width: 300px;
  --sidebar-collapsed-width: 92px;
}

:root[data-theme='dark'] {
  color: #edf4ff;
  background: #0c1222;
  --bg: #0c1222;
  --panel: #121b2d;
  --panel-soft: #17243a;
  --text: #edf4ff;
  --muted: #9aa9c4;
  --line: #26344d;
  --primary: #55a0ff;
  --primary-soft: #142b4d;
  --success: #36d179;
  --warning: #ffb84a;
  --danger: #ff6b6b;
  --shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--bg);
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  background: var(--bg);
  transition: grid-template-columns 180ms ease;
}

.main-column {
  min-width: 0;
}

.sidebar-collapsed {
  --sidebar-width: var(--sidebar-collapsed-width);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  border-bottom: 1px solid var(--line);
  padding: 0 32px;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  backdrop-filter: blur(14px);
  box-shadow: 0 4px 24px rgba(18, 35, 72, 0.05);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-chip,
.icon-button,
.notification-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  background: var(--panel);
}

.control-chip {
  gap: 6px;
  padding: 0 10px;
}

.control-chip select {
  width: 54px;
  border: 0;
  color: inherit;
  background: transparent;
  font-weight: 800;
}

.icon-button,
.notification-button {
  width: 42px;
}

.notification-button {
  position: relative;
}

.notification-button span {
  position: absolute;
  top: -7px;
  right: -7px;
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
}

.avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(135deg, #0a4a98, #6aa9ff);
  font-weight: 800;
}

.user-card strong,
.user-card small {
  display: block;
}

.user-card small {
  margin-top: 3px;
  color: var(--muted);
}

.workspace {
  min-width: 0;
}

.login-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
}

.login-panel {
  width: min(420px, 100%);
  display: grid;
  gap: 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 28px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.login-brand {
  display: grid;
  gap: 8px;
}

.login-brand strong {
  color: var(--text);
  font-size: 1.55rem;
}

.login-brand span,
.login-panel p {
  margin: 0;
  color: var(--muted);
}

.login-panel label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-weight: 750;
}

.login-panel input {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--text);
  background: var(--panel-soft);
}

.primary-action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 8px;
  padding: 0 16px;
  color: #ffffff;
  background: var(--primary);
  font-weight: 800;
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .topbar {
    justify-content: space-between;
    padding: 12px 18px;
  }
}

@media (max-width: 620px) {
  .topbar {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .topbar-actions {
    justify-content: space-between;
  }
}
</style>
