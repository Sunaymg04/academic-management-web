<script setup>
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  GraduationCap,
  ReceiptText,
  School,
  Users,
} from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const labels = {
  es: {
    university: 'Universidad Nacional',
    students: 'Estudiantes',
    enrollments: 'Matrícula',
    payments: 'Pagos',
    courses: 'Asignaturas',
    grades: 'Notas',
    office: 'Vicerrectorado Académico',
    version: 'Versión 1.0.0',
    collapse: 'Colapsar menú',
    expand: 'Expandir menú',
  },
  en: {
    university: 'National University',
    students: 'Students',
    enrollments: 'Enrollment',
    payments: 'Payments',
    courses: 'Courses',
    grades: 'Grades',
    office: 'Academic Vice-Rectorate',
    version: 'Version 1.0.0',
    collapse: 'Collapse menu',
    expand: 'Expand menu',
  },
}

const navItems = [
  { key: 'students', icon: Users, to: '/students' },
  { key: 'enrollments', icon: ClipboardCheck, to: '/enrollments' },
  { key: 'payments', icon: ReceiptText, to: '/payments' },
  { key: 'courses', icon: School, to: '/courses' },
  { key: 'grades', icon: FilePenLine, to: '/grades' },
]

function t(key) {
  return labels[ui.language][key]
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed: ui.sidebarCollapsed }"
    aria-label="Main navigation"
  >
    <div class="brand">
      <span class="brand-mark">
        <GraduationCap :size="34" stroke-width="2.1" />
      </span>
      <strong>{{ t('university') }}</strong>
    </div>

    <button
      type="button"
      class="collapse-button"
      :title="ui.sidebarCollapsed ? t('expand') : t('collapse')"
      :aria-label="ui.sidebarCollapsed ? t('expand') : t('collapse')"
      @click="ui.toggleSidebar"
    >
      <ChevronRight v-if="ui.sidebarCollapsed" :size="20" />
      <ChevronLeft v-else :size="20" />
    </button>

    <nav class="main-nav">
      <template v-for="item in navItems" :key="item.key">
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="nav-link"
          :title="ui.sidebarCollapsed ? t(item.key) : null"
        >
          <component :is="item.icon" :size="22" />
          <span>{{ t(item.key) }}</span>
        </RouterLink>

        <span
          v-else
          class="nav-link is-disabled"
          :title="ui.sidebarCollapsed ? t(item.key) : null"
        >
          <component :is="item.icon" :size="22" />
          <span>{{ t(item.key) }}</span>
        </span>
      </template>
    </nav>

    <div class="sidebar-footer">
      <Building2 :size="24" />
      <span>{{ t('office') }}</span>
      <small>{{ t('version') }}</small>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  width: var(--sidebar-width);
  height: 100vh;
  flex-direction: column;
  padding: 24px 18px;
  color: var(--text);
  background: var(--panel);
  border-right: 1px solid var(--line);
  transition:
    width 180ms ease,
    padding 180ms ease;
}

.brand {
  display: grid;
  grid-template-columns: 66px 1fr;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  margin-bottom: 26px;
}

.brand-mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border: 3px solid #0a4a98;
  border-radius: 50%;
  color: #0a4a98;
  background: #eef6ff;
}

.brand strong {
  max-width: 160px;
  color: #0a3a79;
  font-size: 1.36rem;
  line-height: 1.12;
}

:global(:root[data-theme='dark']) .brand strong {
  color: #edf4ff;
}

.collapse-button {
  position: absolute;
  top: 88px;
  right: -17px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--primary);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.main-nav {
  display: grid;
  gap: 10px;
}

.nav-link {
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 8px;
  padding: 0 18px;
  color: var(--muted);
  text-decoration: none;
  font-weight: 650;
  white-space: nowrap;
}

.nav-link svg {
  flex: 0 0 auto;
}

.nav-link.router-link-active {
  position: relative;
  color: var(--primary);
  background: var(--primary-soft);
}

.nav-link.router-link-active::after {
  position: absolute;
  top: 8px;
  right: 0;
  bottom: 8px;
  width: 4px;
  border-radius: 999px 0 0 999px;
  background: var(--primary);
  content: '';
}

.nav-link.is-disabled {
  cursor: default;
}

.sidebar-footer {
  display: grid;
  gap: 10px;
  margin-top: auto;
  border-top: 1px solid var(--line);
  padding: 22px 10px 0;
  color: var(--muted);
}

.sidebar-footer span {
  color: var(--text);
  font-weight: 650;
}

.collapsed {
  padding-inline: 14px;
}

.collapsed .brand {
  grid-template-columns: 1fr;
  justify-items: center;
}

.collapsed .brand strong,
.collapsed .nav-link span,
.collapsed .sidebar-footer span,
.collapsed .sidebar-footer small {
  display: none;
}

.collapsed .brand-mark {
  width: 52px;
  height: 52px;
}

.collapsed .nav-link {
  justify-content: center;
  gap: 0;
  padding: 0;
}

.collapsed .nav-link.router-link-active::after {
  right: -14px;
}

.collapsed .sidebar-footer {
  justify-items: center;
  padding-inline: 0;
}

@media (max-width: 980px) {
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    min-height: auto;
    padding: 16px 18px;
  }

  .collapse-button {
    display: none;
  }

  .brand {
    grid-template-columns: 54px 1fr;
    min-height: 54px;
    margin-bottom: 16px;
  }

  .brand-mark {
    width: 52px;
    height: 52px;
  }

  .brand strong {
    font-size: 1.12rem;
  }

  .main-nav {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .nav-link {
    min-width: max-content;
  }

  .sidebar-footer {
    display: none;
  }

  .collapsed .brand {
    grid-template-columns: 54px 1fr;
    justify-items: start;
  }

  .collapsed .brand strong,
  .collapsed .nav-link span {
    display: inline;
  }
}
</style>
