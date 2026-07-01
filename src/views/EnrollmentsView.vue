<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Search,
  Send,
  UserRoundCheck,
} from '@lucide/vue'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const enrollmentsStore = useEnrollmentsStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Gestión de Matrícula',
    subtitle: 'Inscripción académica por período, carrera y asignaturas',
    student: 'Estudiante',
    period: 'Período académico',
    program: 'Carrera',
    subjects: 'Asignaturas',
    notes: 'Notas administrativas',
    create: 'Crear matrícula',
    search: 'Buscar matrícula o estudiante',
    allStatuses: 'Todos los estados',
    total: 'Matrículas',
    draft: 'Borradores',
    pending: 'Pendientes de pago',
    enrolled: 'Inscritos',
    cancelled: 'Canceladas',
    selectedSubjects: 'Asignaturas seleccionadas',
    credits: 'créditos',
    status: 'Estado',
    lastUpdate: 'Última actualización',
    actions: 'Acciones',
    detail: 'Detalle de matrícula',
    confirmPayment: 'Confirmar pago',
    markEnrolled: 'Marcar inscrito',
    cancel: 'Cancelar matrícula',
    history: 'Historial',
    relatedStudent: 'Estudiante relacionado',
    automaticStatus: 'El estado cambia automáticamente según el flujo académico y de pago.',
    noResults: 'No hay matrículas para los filtros seleccionados.',
    created: 'Matrícula creada correctamente.',
    emptySubjects: 'Selecciona al menos una asignatura para generar una matrícula pendiente de pago.',
  },
  en: {
    title: 'Enrollment Management',
    subtitle: 'Academic registration by period, program, and subjects',
    student: 'Student',
    period: 'Academic period',
    program: 'Program',
    subjects: 'Subjects',
    notes: 'Administrative notes',
    create: 'Create enrollment',
    search: 'Search enrollment or student',
    allStatuses: 'All statuses',
    total: 'Enrollments',
    draft: 'Drafts',
    pending: 'Pending payment',
    enrolled: 'Enrolled',
    cancelled: 'Cancelled',
    selectedSubjects: 'Selected subjects',
    credits: 'credits',
    status: 'Status',
    lastUpdate: 'Last update',
    actions: 'Actions',
    detail: 'Enrollment detail',
    confirmPayment: 'Confirm payment',
    markEnrolled: 'Mark enrolled',
    cancel: 'Cancel enrollment',
    history: 'History',
    relatedStudent: 'Related student',
    automaticStatus: 'Status changes automatically based on the academic and payment flow.',
    noResults: 'No enrollments match the selected filters.',
    created: 'Enrollment created successfully.',
    emptySubjects: 'Select at least one subject to generate a pending payment enrollment.',
  },
}

const statusLabels = {
  es: {
    Draft: 'Borrador',
    'Pending Payment': 'Pago pendiente',
    'Payment Confirmed': 'Pago confirmado',
    Enrolled: 'Inscrito',
    Cancelled: 'Cancelado',
  },
  en: {
    Draft: 'Draft',
    'Pending Payment': 'Pending Payment',
    'Payment Confirmed': 'Payment Confirmed',
    Enrolled: 'Enrolled',
    Cancelled: 'Cancelled',
  },
}

const form = reactive({
  studentId: studentsStore.students[0]?.id ?? '',
  academicPeriod: enrollmentsStore.academicPeriods[0],
  program: enrollmentsStore.programs[0],
  subjectCodes: [],
  notes: '',
})
const filters = reactive({
  search: '',
  status: '',
})
const feedback = ref('')

const availableSubjects = computed(() => enrollmentsStore.getSubjectsByProgram(form.program))
const selectedEnrollment = computed(() => enrollmentsStore.selectedEnrollment)

const filteredEnrollments = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return enrollmentsStore.enrollments.filter((enrollment) => {
    const student = findStudent(enrollment.studentId)
    const matchesStatus = !filters.status || enrollment.status === filters.status
    const matchesSearch =
      !query ||
      [
        enrollment.id,
        enrollment.program,
        enrollment.academicPeriod,
        student?.id,
        student?.firstName,
        student?.lastName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesStatus && matchesSearch
  })
})

const metricCards = computed(() => [
  {
    label: t('total'),
    value: enrollmentsStore.enrollments.length,
    tone: 'blue',
    icon: ClipboardCheck,
  },
  {
    label: t('draft'),
    value: enrollmentsStore.draftCount,
    tone: 'gray',
    icon: FileText,
  },
  {
    label: t('pending'),
    value: enrollmentsStore.pendingPaymentCount,
    tone: 'amber',
    icon: BadgeDollarSign,
  },
  {
    label: t('enrolled'),
    value: enrollmentsStore.enrolledCount,
    tone: 'green',
    icon: UserRoundCheck,
  },
  {
    label: t('cancelled'),
    value: enrollmentsStore.cancelledCount,
    tone: 'red',
    icon: Ban,
  },
])

function t(key) {
  return copy[ui.language][key]
}

function label(value) {
  return statusLabels[ui.language][value] ?? value
}

function statusClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-')
}

function findStudent(studentId) {
  return studentsStore.students.find((student) => student.id === studentId)
}

function studentName(studentId) {
  const student = findStudent(studentId)

  return student ? `${student.firstName} ${student.lastName}` : studentId
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

function submitEnrollment() {
  const result = enrollmentsStore.createEnrollment({ ...form })

  feedback.value = result.ok ? t('created') : result.message
  form.subjectCodes = []
  form.notes = ''
}

function selectEnrollment(enrollmentId) {
  enrollmentsStore.selectEnrollment(enrollmentId)
  const enrollment = enrollmentsStore.selectedEnrollment

  if (enrollment) studentsStore.selectStudent(enrollment.studentId)
}

watch(
  () => form.program,
  () => {
    form.subjectCodes = []
  },
)
</script>

<template>
  <section class="enrollments-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="form-card">
      <div class="section-title">
        <div>
          <h2>{{ t('create') }}</h2>
          <span>{{ t('automaticStatus') }}</span>
        </div>
      </div>

      <form class="enrollment-form" @submit.prevent="submitEnrollment">
        <label>
          {{ t('student') }}
          <select v-model="form.studentId" required>
            <option v-for="student in studentsStore.students" :key="student.id" :value="student.id">
              {{ student.id }} · {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </label>

        <label>
          {{ t('period') }}
          <select v-model="form.academicPeriod" required>
            <option v-for="period in enrollmentsStore.academicPeriods" :key="period" :value="period">
              {{ period }}
            </option>
          </select>
        </label>

        <label>
          {{ t('program') }}
          <select v-model="form.program" required>
            <option v-for="program in enrollmentsStore.programs" :key="program" :value="program">
              {{ program }}
            </option>
          </select>
        </label>

        <label class="wide">
          {{ t('notes') }}
          <input v-model.trim="form.notes" placeholder="Optional notes" />
        </label>

        <fieldset class="subjects-field">
          <legend>{{ t('subjects') }}</legend>
          <label v-for="subject in availableSubjects" :key="subject.code" class="subject-option">
            <input v-model="form.subjectCodes" type="checkbox" :value="subject.code" />
            <span>
              <strong>{{ subject.code }}</strong>
              {{ subject.name }}
              <small>{{ subject.credits }} {{ t('credits') }}</small>
            </span>
          </label>
        </fieldset>

        <div class="form-footer">
          <p aria-live="polite">
            {{ feedback || (!form.subjectCodes.length ? t('emptySubjects') : '') }}
          </p>
          <button type="submit" class="primary-action">
            <Send :size="20" />
            {{ t('create') }}
          </button>
        </div>
      </form>
    </section>

    <section class="metrics-grid">
      <article
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :class="`tone-${card.tone}`"
      >
        <span class="metric-icon">
          <component :is="card.icon" :size="28" />
        </span>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </article>
    </section>

    <div class="content-grid">
      <section class="list-card">
        <div class="filters-card">
          <label class="search-field">
            {{ t('search') }}
            <span>
              <Search :size="20" />
              <input v-model="filters.search" type="search" :placeholder="t('search')" />
            </span>
          </label>

          <label>
            {{ t('status') }}
            <select v-model="filters.status">
              <option value="">{{ t('allStatuses') }}</option>
              <option v-for="status in enrollmentsStore.statusFlow" :key="status" :value="status">
                {{ label(status) }}
              </option>
            </select>
          </label>
        </div>

        <div class="enrollment-table" role="table" aria-label="Enrollment records">
          <div class="enrollment-row table-head" role="row">
            <span>ID</span>
            <span>{{ t('student') }}</span>
            <span>{{ t('period') }}</span>
            <span>{{ t('program') }}</span>
            <span>{{ t('selectedSubjects') }}</span>
            <span>{{ t('status') }}</span>
            <span>{{ t('lastUpdate') }}</span>
          </div>

          <button
            v-for="enrollment in filteredEnrollments"
            :key="enrollment.id"
            type="button"
            class="enrollment-row"
            :class="{ selected: selectedEnrollment?.id === enrollment.id }"
            @click="selectEnrollment(enrollment.id)"
          >
            <span>{{ enrollment.id }}</span>
            <span>{{ studentName(enrollment.studentId) }}</span>
            <span>{{ enrollment.academicPeriod }}</span>
            <span>{{ enrollment.program }}</span>
            <span>{{ enrollment.subjects.length }} · {{ enrollment.totalCredits }} {{ t('credits') }}</span>
            <span>
              <mark class="pill" :class="statusClass(enrollment.status)">
                {{ label(enrollment.status) }}
              </mark>
            </span>
            <span>{{ formatDate(enrollment.updatedAt) }}</span>
          </button>

          <p v-if="!filteredEnrollments.length" class="empty-state">{{ t('noResults') }}</p>
        </div>
      </section>

      <aside v-if="selectedEnrollment" class="detail-card">
        <div class="detail-header">
          <h2>{{ t('detail') }}</h2>
          <mark class="pill" :class="statusClass(selectedEnrollment.status)">
            {{ label(selectedEnrollment.status) }}
          </mark>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>ID</dt>
            <dd>{{ selectedEnrollment.id }}</dd>
          </div>
          <div>
            <dt>{{ t('relatedStudent') }}</dt>
            <dd>{{ studentName(selectedEnrollment.studentId) }}</dd>
          </div>
          <div>
            <dt>{{ t('period') }}</dt>
            <dd>{{ selectedEnrollment.academicPeriod }}</dd>
          </div>
          <div>
            <dt>{{ t('program') }}</dt>
            <dd>{{ selectedEnrollment.program }}</dd>
          </div>
        </dl>

        <section class="subjects-card">
          <h3>{{ t('selectedSubjects') }}</h3>
          <ul>
            <li v-for="subject in selectedEnrollment.subjects" :key="subject.code">
              <span>
                <strong>{{ subject.code }}</strong>
                {{ subject.name }}
              </span>
              <small>{{ subject.credits }} {{ t('credits') }}</small>
            </li>
          </ul>
        </section>

        <div class="action-grid">
          <button
            type="button"
            class="outline-action"
            :disabled="selectedEnrollment.status === 'Cancelled'"
            @click="enrollmentsStore.confirmPayment(selectedEnrollment.id)"
          >
            <BadgeDollarSign :size="19" />
            {{ t('confirmPayment') }}
          </button>
          <button
            type="button"
            class="primary-action"
            :disabled="selectedEnrollment.status !== 'Payment Confirmed'"
            @click="enrollmentsStore.markEnrolled(selectedEnrollment.id)"
          >
            <CheckCircle2 :size="19" />
            {{ t('markEnrolled') }}
          </button>
          <button
            type="button"
            class="danger-action"
            :disabled="selectedEnrollment.status === 'Cancelled'"
            @click="enrollmentsStore.cancelEnrollment(selectedEnrollment.id)"
          >
            <Ban :size="19" />
            {{ t('cancel') }}
          </button>
        </div>

        <section class="history-list">
          <h3>
            <Clock3 :size="18" />
            {{ t('history') }}
          </h3>
          <ol>
            <li v-for="event in selectedEnrollment.history" :key="`${event.date}-${event.title}`">
              <time>{{ formatDate(event.date) }}</time>
              <strong>{{ event.title }}</strong>
              <span>{{ event.detail }}</span>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.enrollments-page {
  display: grid;
  gap: 22px;
  padding: 28px 30px 36px;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 2.45rem);
  line-height: 1.05;
}

.page-heading p,
.section-title span,
.empty-state {
  margin: 0;
  color: var(--muted);
}

.form-card,
.metric-card,
.list-card,
.detail-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.form-card,
.list-card,
.detail-card {
  padding: 18px;
}

.section-title,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title h2,
.detail-header h2,
.subjects-card h3,
.history-list h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.enrollment-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

.wide {
  grid-column: span 1;
}

input,
select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--text);
  background: var(--panel);
}

.subjects-field {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  margin: 0;
  padding: 14px;
}

.subjects-field legend {
  padding: 0 8px;
  color: var(--text);
  font-weight: 850;
}

.subject-option {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: start;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  background: var(--panel-soft);
}

.subject-option input {
  min-height: auto;
  margin-top: 4px;
}

.subject-option span,
.subject-option small,
.subject-option strong {
  display: block;
}

.subject-option small {
  margin-top: 4px;
  color: var(--muted);
}

.form-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}

.form-footer p {
  margin: 0;
  color: var(--muted);
  font-weight: 750;
}

.primary-action,
.outline-action,
.danger-action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 850;
}

.primary-action {
  border: 0;
  color: #ffffff;
  background: var(--primary);
}

.outline-action {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: transparent;
}

.danger-action {
  border: 1px solid var(--danger);
  color: var(--danger);
  background: transparent;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}

.metric-card {
  min-height: 118px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
}

.metric-icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
}

.tone-blue .metric-icon {
  background: #1475f8;
}

.tone-gray .metric-icon {
  background: #6b7891;
}

.tone-amber .metric-icon {
  background: #ff9f1c;
}

.tone-green .metric-icon {
  background: #22b85f;
}

.tone-red .metric-icon {
  background: #ff5757;
}

.metric-card div > span {
  display: block;
  color: var(--muted);
}

.metric-card strong {
  display: block;
  margin-top: 6px;
  color: var(--text);
  font-size: 1.75rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 470px);
  gap: 18px;
  align-items: start;
}

.filters-card {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 220px;
  gap: 14px;
  align-items: end;
  margin-bottom: 14px;
}

.search-field span {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
}

.search-field input {
  border: 0;
  padding: 0;
}

.enrollment-table {
  overflow-x: auto;
}

.enrollment-row {
  width: 100%;
  min-width: 960px;
  display: grid;
  grid-template-columns: 132px 1.1fr 110px 1.25fr 140px 150px 130px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.enrollment-row:not(.table-head):hover,
.enrollment-row.selected {
  background: var(--primary-soft);
  outline: 1px solid color-mix(in srgb, var(--primary) 32%, transparent);
}

.table-head {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 850;
}

.pill {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: 6px;
  padding: 0 10px;
  color: #6b7891;
  background: #eef2f7;
  font-size: 0.78rem;
  font-weight: 850;
}

.pill.pending-payment {
  color: #d87500;
  background: #fff1d8;
}

.pill.payment-confirmed {
  color: #0969ee;
  background: #e7f1ff;
}

.pill.enrolled {
  color: #087c35;
  background: #dff4e8;
}

.pill.cancelled {
  color: #dc2434;
  background: #ffe2e5;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0 0 16px;
}

dt {
  margin-bottom: 5px;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 850;
}

dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.subjects-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.subjects-card ul,
.history-list ol {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.subjects-card li {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: var(--text);
}

.subjects-card small,
.history-list time,
.history-list span {
  color: var(--muted);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 14px;
}

.history-list {
  margin-top: 16px;
}

.history-list li {
  display: grid;
  gap: 4px;
  border-left: 3px solid var(--primary);
  padding-left: 12px;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .enrollment-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .enrollments-page {
    padding: 20px;
  }

  .enrollment-form,
  .filters-card,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-footer,
  .section-title,
  .detail-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
