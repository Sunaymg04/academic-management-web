<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { BadgeCheck, FileCheck2, FileText, Send, UserPlus, Users } from '@lucide/vue'
import { useAdmissionsStore } from '@/stores/admissions'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useUiStore } from '@/stores/ui'

const admissionsStore = useAdmissionsStore()
const enrollmentsStore = useEnrollmentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Admisiones y Documentos',
    subtitle: 'Aspirantes, expedientes documentales y conversion a estudiantes',
    createApplicant: 'Crear aspirante',
    applicant: 'Aspirante',
    document: 'Documento',
    documents: 'Documentos',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    documentId: 'Documento identidad',
    email: 'Correo',
    phone: 'Telefono',
    program: 'Carrera',
    period: 'Curso',
    group: 'Grupo',
    source: 'Origen',
    notes: 'Notas',
    create: 'Crear',
    send: 'Enviar solicitud',
    convert: 'Convertir a estudiante',
    saveDocument: 'Guardar documento',
    type: 'Tipo',
    name: 'Nombre del archivo',
    filePath: 'Ruta o referencia',
    status: 'Estado',
    rejectionReason: 'Motivo de rechazo',
    pendingDocuments: 'Pendientes',
    submitted: 'En revision',
    converted: 'Convertidos',
    allApplicants: 'Aspirantes',
    allDocuments: 'Documentos',
    noApplicants: 'No hay aspirantes registrados.',
    noDocuments: 'No hay documentos registrados.',
    saved: 'Guardado correctamente.',
  },
  en: {
    title: 'Admissions and Documents',
    subtitle: 'Applicants, document files, and student conversion',
    createApplicant: 'Create applicant',
    applicant: 'Applicant',
    document: 'Document',
    documents: 'Documents',
    firstName: 'First name',
    lastName: 'Last name',
    documentId: 'Identity document',
    email: 'Email',
    phone: 'Phone',
    program: 'Program',
    period: 'Academic period',
    group: 'Group',
    source: 'Source',
    notes: 'Notes',
    create: 'Create',
    send: 'Submit application',
    convert: 'Convert to student',
    saveDocument: 'Save document',
    type: 'Type',
    name: 'File name',
    filePath: 'Path or reference',
    status: 'Status',
    rejectionReason: 'Rejection reason',
    pendingDocuments: 'Pending',
    submitted: 'In review',
    converted: 'Converted',
    allApplicants: 'Applicants',
    allDocuments: 'Documents',
    noApplicants: 'No applicants registered.',
    noDocuments: 'No documents registered.',
    saved: 'Saved successfully.',
  },
}

const applicantForm = reactive({
  firstName: '',
  lastName: '',
  documentType: 'carnet',
  documentId: '',
  email: '',
  phone: '',
  careerId: null,
  courseId: null,
  groupId: null,
  source: 'web',
  notes: '',
})
const documentForm = reactive({
  applicantId: '',
  type: admissionsStore.documentTypes[0],
  name: '',
  filePath: '',
  status: 'pending',
  rejectionReason: '',
})
const feedback = ref('')

const selectedApplicant = computed(() => admissionsStore.selectedApplicant)
const applicantDocuments = computed(() => {
  const applicant = selectedApplicant.value

  if (!applicant) return []

  return admissionsStore.documents.filter(
    (document) => document.applicantApiId === applicant.apiId || document.applicantId === applicant.id,
  )
})
const metrics = computed(() => [
  { label: t('allApplicants'), value: admissionsStore.applicants.length, icon: Users },
  { label: t('submitted'), value: admissionsStore.submittedCount, icon: Send },
  { label: t('pendingDocuments'), value: admissionsStore.pendingDocumentsCount, icon: FileText },
  { label: t('converted'), value: admissionsStore.convertedCount, icon: BadgeCheck },
])

function t(key) {
  return copy[ui.language][key]
}

function applicantName(applicant) {
  return applicant ? `${applicant.firstName} ${applicant.lastName}` : ''
}

function selectApplicant(applicantId) {
  admissionsStore.selectApplicant(applicantId)
  documentForm.applicantId = applicantId
}

async function createApplicant() {
  const result = await admissionsStore.createApplicant({ ...applicantForm })

  feedback.value = result.ok ? t('saved') : result.message
  if (result.ok) {
    documentForm.applicantId = result.applicant.id
    applicantForm.firstName = ''
    applicantForm.lastName = ''
    applicantForm.documentId = ''
    applicantForm.email = ''
    applicantForm.phone = ''
    applicantForm.notes = ''
  }
}

async function saveDocument() {
  const result = await admissionsStore.saveDocument({ ...documentForm })

  feedback.value = result.ok ? t('saved') : result.message
  if (result.ok) {
    documentForm.name = ''
    documentForm.filePath = ''
    documentForm.rejectionReason = ''
  }
}

async function submitSelected() {
  if (!selectedApplicant.value) return

  const result = await admissionsStore.submitApplicant(selectedApplicant.value.id)

  feedback.value = result.ok ? t('saved') : result.message
}

async function convertSelected() {
  if (!selectedApplicant.value) return

  const result = await admissionsStore.convertApplicant(selectedApplicant.value.id, {
    student_code: `EST-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    group_id: selectedApplicant.value.groupId,
    admission_date: new Date().toISOString().slice(0, 10),
    status: 'active',
  })

  feedback.value = result.ok ? t('saved') : result.message
}

watch(
  () => admissionsStore.selectedApplicant,
  (applicant) => {
    if (applicant && !documentForm.applicantId) documentForm.applicantId = applicant.id
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.allSettled([
    enrollmentsStore.fetchCatalogs(),
    admissionsStore.fetchApplicants(),
    admissionsStore.fetchDocuments(),
  ])
})
</script>

<template>
  <section class="admissions-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="metrics-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <component :is="metric.icon" :size="22" />
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </section>

    <section class="work-grid">
      <form class="form-card" @submit.prevent="createApplicant">
        <div class="section-title">
          <h2>{{ t('createApplicant') }}</h2>
        </div>

        <div class="form-grid">
          <label>{{ t('firstName') }}<input v-model.trim="applicantForm.firstName" required /></label>
          <label>{{ t('lastName') }}<input v-model.trim="applicantForm.lastName" required /></label>
          <label>{{ t('documentId') }}<input v-model.trim="applicantForm.documentId" required /></label>
          <label>{{ t('email') }}<input v-model.trim="applicantForm.email" type="email" /></label>
          <label>{{ t('phone') }}<input v-model.trim="applicantForm.phone" /></label>
          <label>
            {{ t('program') }}
            <select v-model="applicantForm.careerId">
              <option :value="null">-</option>
              <option v-for="program in enrollmentsStore.programCatalog" :key="program.id" :value="program.id">
                {{ program.name }}
              </option>
            </select>
          </label>
          <label>
            {{ t('period') }}
            <select v-model="applicantForm.courseId">
              <option :value="null">-</option>
              <option v-for="period in enrollmentsStore.academicPeriods" :key="period" :value="null">
                {{ period }}
              </option>
            </select>
          </label>
          <label>{{ t('source') }}<input v-model.trim="applicantForm.source" /></label>
        </div>

        <label>{{ t('notes') }}<textarea v-model.trim="applicantForm.notes" rows="3" /></label>

        <button type="submit" class="primary-action">
          <UserPlus :size="18" />
          {{ t('create') }}
        </button>
      </form>

      <form class="form-card" @submit.prevent="saveDocument">
        <div class="section-title">
          <h2>{{ t('saveDocument') }}</h2>
        </div>

        <label>
          {{ t('applicant') }}
          <select v-model="documentForm.applicantId" required>
            <option v-for="applicant in admissionsStore.applicants" :key="applicant.id" :value="applicant.id">
              {{ applicant.id }} - {{ applicantName(applicant) }}
            </option>
          </select>
        </label>

        <div class="form-grid">
          <label>
            {{ t('type') }}
            <select v-model="documentForm.type">
              <option v-for="type in admissionsStore.documentTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label>{{ t('name') }}<input v-model.trim="documentForm.name" required /></label>
          <label>{{ t('filePath') }}<input v-model.trim="documentForm.filePath" /></label>
          <label>
            {{ t('status') }}
            <select v-model="documentForm.status">
              <option v-for="status in admissionsStore.documentStatuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </label>
        </div>

        <label>{{ t('rejectionReason') }}<textarea v-model.trim="documentForm.rejectionReason" rows="3" /></label>

        <button type="submit" class="primary-action">
          <FileCheck2 :size="18" />
          {{ t('saveDocument') }}
        </button>
      </form>
    </section>

    <p class="feedback" aria-live="polite">{{ feedback || admissionsStore.error }}</p>

    <section class="split-grid">
      <article class="list-panel">
        <h2>{{ t('allApplicants') }}</h2>
        <p v-if="!admissionsStore.applicants.length">{{ t('noApplicants') }}</p>
        <button
          v-for="applicant in admissionsStore.applicants"
          :key="applicant.id"
          type="button"
          class="row-button"
          :class="{ active: selectedApplicant?.id === applicant.id }"
          @click="selectApplicant(applicant.id)"
        >
          <strong>{{ applicantName(applicant) }}</strong>
          <span>{{ applicant.id }} · {{ applicant.status }}</span>
        </button>
      </article>

      <article class="detail-panel">
        <div class="detail-header">
          <div>
            <h2>{{ selectedApplicant ? applicantName(selectedApplicant) : t('applicant') }}</h2>
            <span v-if="selectedApplicant">{{ selectedApplicant.status }} · {{ selectedApplicant.documentId }}</span>
          </div>
          <div class="detail-actions">
            <button type="button" class="ghost-action" @click="submitSelected">{{ t('send') }}</button>
            <button type="button" class="primary-action" @click="convertSelected">{{ t('convert') }}</button>
          </div>
        </div>

        <h3>{{ t('documents') }}</h3>
        <p v-if="!applicantDocuments.length">{{ t('noDocuments') }}</p>
        <ul>
          <li v-for="document in applicantDocuments" :key="document.id">
            <FileText :size="18" />
            <strong>{{ document.name }}</strong>
            <span>{{ document.type }} · {{ document.status }}</span>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.admissions-page {
  display: grid;
  gap: 24px;
  padding: 32px;
}

.page-heading h1,
.page-heading p {
  margin: 0;
}

.page-heading h1 {
  color: var(--text);
  font-size: 2rem;
}

.page-heading p,
.feedback {
  color: var(--muted);
}

.metrics-grid,
.work-grid,
.split-grid {
  display: grid;
  gap: 16px;
}

.metrics-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.work-grid,
.split-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.metric-card,
.form-card,
.list-panel,
.detail-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}

.metric-card {
  display: grid;
  gap: 8px;
  padding: 18px;
}

.metric-card strong {
  color: var(--text);
  font-size: 1.8rem;
}

.form-card,
.list-panel,
.detail-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.section-title h2,
.list-panel h2,
.detail-panel h2,
.detail-panel h3 {
  margin: 0;
  color: var(--text);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 7px;
  color: var(--text);
  font-weight: 750;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text);
  background: var(--panel-soft);
}

.row-button {
  display: grid;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  color: var(--text);
  text-align: left;
  background: var(--panel-soft);
}

.row-button.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.row-button span,
.detail-header span,
li span {
  color: var(--muted);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.detail-actions {
  display: flex;
  gap: 10px;
}

.ghost-action {
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 14px;
  color: var(--text);
  background: var(--panel);
  font-weight: 800;
}

ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
}

@media (max-width: 980px) {
  .admissions-page {
    padding: 20px;
  }

  .metrics-grid,
  .work-grid,
  .split-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .detail-header,
  .detail-actions {
    flex-direction: column;
  }
}
</style>
