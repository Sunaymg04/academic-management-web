<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Bell, ChevronDown, Languages, Moon, Sun } from '@lucide/vue'
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
const auth = useAuthStore()
const studentsStore = useStudentsStore()
const enrollmentsStore = useEnrollmentsStore()
const paymentsStore = usePaymentsStore()
const coursesStore = useCoursesStore()
const gradesStore = useGradesStore()
const certificatesStore = useCertificatesStore()
const authError = ref('')

const labels = {
  es: {
    role: 'Analista Académica',
    loading: 'Cargando datos academicos...',
    retry: 'Reintentar',
    apiErrorTitle: 'No se pudo completar la carga',
    language: 'Idioma',
    theme: 'Tema',
    notifications: 'Notificaciones',
  },
  en: {
    role: 'Academic Analyst',
    loading: 'Loading academic data...',
    retry: 'Retry',
    apiErrorTitle: 'The data load could not be completed',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
  },
}

function t(key) {
  return labels[ui.language][key]
}

const appLoading = computed(() =>
  [
    studentsStore.loading,
    enrollmentsStore.loading,
    paymentsStore.loading,
    coursesStore.loading,
    gradesStore.loading,
    certificatesStore.loading,
  ].some(Boolean),
)

const appErrors = computed(() =>
  [
    studentsStore.error,
    enrollmentsStore.error,
    paymentsStore.error,
    coursesStore.error,
    gradesStore.error,
    certificatesStore.error,
    authError.value,
  ].filter(Boolean),
)

function handleAuthError(event) {
  authError.value =
    event.detail?.status === 403
      ? 'Tu rol no tiene permisos para esta accion.'
      : 'La sesion no es valida o expiro.'
}

async function bootstrapData() {
  authError.value = ''
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

onMounted(async () => {
  window.addEventListener('academic-management:auth-error', handleAuthError)
  await bootstrapData()
})

onBeforeUnmount(() => {
  window.removeEventListener('academic-management:auth-error', handleAuthError)
})
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': ui.sidebarCollapsed }">
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
          <span class="avatar">SM</span>
          <div>
            <strong>{{ auth.user.name }}</strong>
            <small>{{ auth.roleLabel || t('role') }}</small>
          </div>
          <ChevronDown :size="18" />
        </div>
      </header>

      <main class="workspace">
        <div v-if="appLoading" class="app-status loading-state" role="status">
          <span class="spinner" aria-hidden="true"></span>
          {{ t('loading') }}
        </div>

        <div v-if="appErrors.length" class="app-status error-state" role="alert">
          <strong>{{ t('apiErrorTitle') }}</strong>
          <span>{{ appErrors[0] }}</span>
          <button type="button" @click="bootstrapData">{{ t('retry') }}</button>
        </div>

        <RouterView />
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

.app-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 32px 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 16px;
  background: var(--panel);
  box-shadow: 0 8px 28px rgba(18, 35, 72, 0.06);
}

.loading-state {
  color: var(--muted);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 850ms linear infinite;
}

.error-state {
  align-items: flex-start;
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 9%, var(--panel));
}

.error-state strong {
  color: var(--text);
}

.error-state button {
  margin-left: auto;
  border: 1px solid var(--danger);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--danger);
  background: var(--panel);
  font-weight: 750;
}

.empty-state-page {
  display: grid;
  min-height: calc(100vh - 140px);
  place-items: center;
  padding: 32px;
}

.empty-state {
  display: grid;
  max-width: 460px;
  justify-items: center;
  gap: 12px;
  text-align: center;
  color: var(--muted);
}

.empty-state h1,
.empty-state p {
  margin: 0;
}

.empty-state h1 {
  color: var(--text);
}

.empty-state a {
  border-radius: 8px;
  padding: 10px 14px;
  color: #ffffff;
  background: var(--primary);
  text-decoration: none;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .topbar {
    justify-content: space-between;
    padding: 12px 18px;
  }

  .app-status {
    margin-inline: 18px;
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
