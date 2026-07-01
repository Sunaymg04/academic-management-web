import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const language = ref('es')
  const theme = ref('light')
  const sidebarCollapsed = ref(false)

  const isSpanish = computed(() => language.value === 'es')
  const isDark = computed(() => theme.value === 'dark')

  function setLanguage(value) {
    language.value = value
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value
    },
    { immediate: true },
  )

  return {
    language,
    theme,
    isSpanish,
    isDark,
    sidebarCollapsed,
    setLanguage,
    toggleTheme,
    toggleSidebar,
  }
})
