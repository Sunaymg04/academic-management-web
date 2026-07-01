<script setup>
import { ShieldX } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <section class="empty-state-page">
    <div class="empty-state">
      <ShieldX :size="44" />
      <h1>Acceso restringido</h1>
      <p>Tu rol actual no tiene permiso para abrir este modulo.</p>
      <small>Rol activo: {{ auth.roleLabel }}</small>
      <RouterLink to="/dashboard">Volver al dashboard</RouterLink>
    </div>
  </section>
</template>
