<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileWarning,
  Filter,
  Info,
  List,
  Maximize2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  Users,
  X,
} from '@lucide/vue'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Gestión de Estudiantes',
    subtitle: 'Registro, control y seguimiento de la información estudiantil',
    faculty: '',
    program: 'Carrera',
    academicStatus: 'Estado académico',
    enrollment: 'Matrícula',
    all: 'Todas',
    allMasc: 'Todos',
    searchLabel: 'Buscar por ID o nombre',
    searchPlaceholder: 'Buscar por ID o nombre',
    filter: 'Filtrar',
    export: 'Exportar CSV',
    newStudent: 'Nuevo estudiante',
    totalStudents: 'Total de estudiantes',
    active: 'Activos',
    pending: 'Con matrícula pendiente',
    atRisk: 'En riesgo académico',
    duplicates: 'Duplicados prevenidos',
    totalRegistered: '100% del total registrado',
    ofTotal: 'del total',
    validated: 'Identidades validadas',
    summary: 'Resumen por estado académico',
    studentsList: 'Listado de estudiantes',
    showing: 'Mostrando',
    records: 'registros',
    id: 'ID Estudiante',
    name: 'Nombre',
    lastUpdate: 'Última actualización',
    actions: 'Acciones',
    detail: 'Detalle del estudiante',
    validIdentity: 'Identidad validada',
    institutionalEmail: 'Correo institucional',
    academicRisk: 'Riesgo académico',
    entryDate: 'Fecha de ingreso',
    observation: 'Observación',
    tracking: 'Seguimiento',
    fullHistory: 'Ver historial completo',
    edit: 'Editar',
    history: 'Historial',
    save: 'Guardar cambios',
    create: 'Crear estudiante',
    cancel: 'Cancelar',
    formTitleCreate: 'Crear estudiante',
    formTitleEdit: 'Editar estudiante',
    nextId: 'Nuevo ID',
    duplicateSystem: 'Sistema de identificación única y prevención de duplicados activo',
    noResults: 'No hay estudiantes para los filtros seleccionados.',
    feedbackCreated: 'creado correctamente.',
    feedbackUpdated: 'actualizado correctamente.',
    total: 'Total',
    created: 'Creado',
    validatedStep: 'Validado',
    enrolledStep: 'Inscrito',
    updatedStep: 'Actualizado',
    firstName: 'Nombre',
    lastName: 'Apellido',
    document: 'Documento',
    phone: 'Teléfono',
    term: 'Periodo',
    credits: 'Créditos',
    advisor: 'Asesor',
    relatedEnrollments: 'Matrículas relacionadas',
    noEnrollments: 'Sin matrículas registradas todavía.',
  },
  en: {
    title: 'Student Management',
    subtitle: 'Registration, control, and tracking of student information',
    faculty: '',
    program: 'Program',
    academicStatus: 'Academic status',
    enrollment: 'Enrollment',
    all: 'All',
    allMasc: 'All',
    searchLabel: 'Search by ID or name',
    searchPlaceholder: 'Search by ID or name',
    filter: 'Filter',
    export: 'Export CSV',
    newStudent: 'New student',
    totalStudents: 'Total students',
    active: 'Active',
    pending: 'Pending enrollment payment',
    atRisk: 'Academic risk',
    duplicates: 'Duplicates prevented',
    totalRegistered: '100% of registered total',
    ofTotal: 'of total',
    validated: 'Validated identities',
    summary: 'Academic status summary',
    studentsList: 'Student list',
    showing: 'Showing',
    records: 'records',
    id: 'Student ID',
    name: 'Name',
    lastUpdate: 'Last update',
    actions: 'Actions',
    detail: 'Student detail',
    validIdentity: 'Validated identity',
    institutionalEmail: 'Institutional email',
    academicRisk: 'Academic risk',
    entryDate: 'Entry date',
    observation: 'Observation',
    tracking: 'Tracking',
    fullHistory: 'View full history',
    edit: 'Edit',
    history: 'History',
    save: 'Save changes',
    create: 'Create student',
    cancel: 'Cancel',
    formTitleCreate: 'Create student',
    formTitleEdit: 'Edit student',
    nextId: 'New ID',
    duplicateSystem: 'Unique identification and duplicate prevention system active',
    noResults: 'No students match the selected filters.',
    feedbackCreated: 'created successfully.',
    feedbackUpdated: 'updated successfully.',
    total: 'Total',
    created: 'Created',
    validatedStep: 'Validated',
    enrolledStep: 'Enrolled',
    updatedStep: 'Updated',
    firstName: 'First name',
    lastName: 'Last name',
    document: 'Document',
    phone: 'Phone',
    term: 'Term',
    credits: 'Credits',
    advisor: 'Advisor',
    relatedEnrollments: 'Related enrollments',
    noEnrollments: 'No enrollments registered yet.',
  },
}

const statusLabels = {
  es: {
    Active: 'Activo',
    'At Risk': 'En riesgo',
    Graduated: 'Graduado',
    Inactive: 'Inactivo',
    'Pending Payment': 'Pago pendiente',
    Draft: 'Borrador',
    'Payment Confirmed': 'Pago confirmado',
    Enrolled: 'Inscrito',
    Cancelled: 'Cancelado',
    Blocked: 'Bloqueado',
    'Under Review': 'En revisión',
    Low: 'Bajo',
    Medium: 'Medio',
    High: 'Alto',
  },
  en: {
    Active: 'Active',
    'At Risk': 'At risk',
    Graduated: 'Graduated',
    Inactive: 'Inactive',
    'Pending Payment': 'Pending payment',
    Draft: 'Draft',
    'Payment Confirmed': 'Payment confirmed',
    Enrolled: 'Enrolled',
    Cancelled: 'Cancelled',
    Blocked: 'Blocked',
    'Under Review': 'Under review',
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
  },
}

const emptyForm = {
  firstName: '',
  lastName: '',
  documentId: '',
  email: '',
  phone: '',
  program: '',
  faculty: '',
  academicStatus: 'Active',
  enrollmentStatus: 'Pending Payment',
  admissionTerm: '',
  admissionDate: '2026-06-30',
  academicRisk: 'Low',
  gpa: 0,
  creditsCompleted: 0,
  advisor: '',
  observation: '',
}

const form = reactive({ ...emptyForm })
const filters = reactive({
  faculty: '',
  program: '',
  academicStatus: '',
  enrollmentStatus: '',
  search: '',
})
const mode = ref('create')
const feedback = ref('')
const showForm = ref(false)
const showHistory = ref(false)

const selectedStudent = computed(() => studentsStore.selectedStudent)
const isEditing = computed(() => mode.value === 'edit')
const total = computed(() => studentsStore.students.length)
const lang = computed(() => ui.language)

const filteredStudents = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return studentsStore.students.filter((student) => {
    const matchesFaculty = !filters.faculty || student.faculty === filters.faculty
    const matchesProgram = !filters.program || student.program === filters.program
    const matchesAcademic =
      !filters.academicStatus || student.academicStatus === filters.academicStatus
    const matchesEnrollment =
      !filters.enrollmentStatus || student.enrollmentStatus === filters.enrollmentStatus
    const matchesSearch =
      !query ||
      [student.id, student.firstName, student.lastName, student.documentId, student.email]
        .join(' ')
        .toLowerCase()
        .includes(query)

    return matchesFaculty && matchesProgram && matchesAcademic && matchesEnrollment && matchesSearch
  })
})

const statusSummary = computed(() => {
  const statuses = ['Active', 'At Risk', 'Graduated', 'Inactive']

  return statuses.map((status) => {
    const count = studentsStore.students.filter((student) => student.academicStatus === status).length
    const percent = total.value ? Math.round((count / total.value) * 1000) / 10 : 0

    return { status, count, percent }
  })
})

const metricCards = computed(() => [
  {
    label: t('totalStudents'),
    value: total.value,
    helper: t('totalRegistered'),
    tone: 'blue',
    icon: Users,
  },
  {
    label: t('active'),
    value: studentsStore.activeCount,
    helper: percentHelper(studentsStore.activeCount),
    tone: 'green',
    icon: UserCheck,
  },
  {
    label: t('pending'),
    value: studentsStore.pendingEnrollmentCount,
    helper: percentHelper(studentsStore.pendingEnrollmentCount),
    tone: 'amber',
    icon: FileWarning,
  },
  {
    label: t('atRisk'),
    value: studentsStore.atRiskCount,
    helper: percentHelper(studentsStore.atRiskCount),
    tone: 'red',
    icon: TriangleAlert,
  },
])

function t(key) {
  return copy[ui.language][key]
}

function label(value) {
  return statusLabels[ui.language][value] ?? value
}

function percentHelper(value) {
  const percent = total.value ? Math.round((value / total.value) * 1000) / 10 : 0

  return `${percent}% ${t('ofTotal')}`
}

function statusClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-')
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

function resetForm() {
  Object.assign(form, emptyForm)
  mode.value = 'create'
  feedback.value = ''
  showForm.value = true
}

function editStudent(student = selectedStudent.value) {
  if (!student) return

  Object.assign(form, {
    firstName: student.firstName,
    lastName: student.lastName,
    documentId: student.documentId,
    email: student.email,
    phone: student.phone,
    program: student.program,
    faculty: student.faculty,
    academicStatus: student.academicStatus,
    enrollmentStatus: student.enrollmentStatus,
    admissionTerm: student.admissionTerm,
    admissionDate: student.admissionDate,
    academicRisk: student.academicRisk,
    gpa: student.gpa,
    creditsCompleted: student.creditsCompleted,
    advisor: student.advisor,
    observation: student.observation,
  })
  studentsStore.selectStudent(student.id)
  mode.value = 'edit'
  feedback.value = ''
  showForm.value = true
}

async function submitStudent() {
  const payload = { ...form }
  const result = await (isEditing.value
    ? studentsStore.updateStudent(selectedStudent.value.id, payload)
    : studentsStore.createStudent(payload))

  if (!result.ok) {
    feedback.value = result.message
    return
  }

  feedback.value = `${result.student.id} ${
    isEditing.value ? t('feedbackUpdated') : t('feedbackCreated')
  }`
  showForm.value = false

  if (!isEditing.value) Object.assign(form, emptyForm)
}

function chooseStudent(studentId) {
  studentsStore.selectStudent(studentId)
  showHistory.value = false
}

function applyFilters() {
  const firstMatch = filteredStudents.value[0]

  if (firstMatch) studentsStore.selectStudent(firstMatch.id)
}

function exportCsv() {
  const rows = [
    ['id', 'name', 'program', 'faculty', 'academic_status', 'enrollment_status', 'last_updated'],
    ...filteredStudents.value.map((student) => [
      student.id,
      `${student.firstName} ${student.lastName}`,
      student.program,
      student.faculty,
      student.academicStatus,
      student.enrollmentStatus,
      student.lastUpdated,
    ]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'students.csv'
  link.click()
  URL.revokeObjectURL(url)
}

watch(selectedStudent, () => {
  if (isEditing.value && showForm.value) editStudent(selectedStudent.value)
})
</script>

<template>
  <section class="students-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="filters-card" aria-label="Student filters">
      <label>
        {{ t('faculty') }}
        <select v-model="filters.faculty">
          <option value="">{{ t('all') }}</option>
          <option v-for="faculty in studentsStore.faculties" :key="faculty" :value="faculty">
            {{ faculty }}
          </option>
        </select>
      </label>

      <label>
        {{ t('program') }}
        <select v-model="filters.program">
          <option value="">{{ t('all') }}</option>
          <option v-for="program in studentsStore.programs" :key="program" :value="program">
            {{ program }}
          </option>
        </select>
      </label>

      <label>
        {{ t('academicStatus') }}
        <select v-model="filters.academicStatus">
          <option value="">{{ t('allMasc') }}</option>
          <option v-for="status in studentsStore.academicStatuses" :key="status" :value="status">
            {{ label(status) }}
          </option>
        </select>
      </label>

      <label>
        {{ t('enrollment') }}
        <select v-model="filters.enrollmentStatus">
          <option value="">{{ t('all') }}</option>
          <option
            v-for="status in studentsStore.enrollmentStatuses"
            :key="status"
            :value="status"
          >
            {{ label(status) }}
          </option>
        </select>
      </label>

      <label class="search-field">
        {{ t('searchLabel') }}
        <span>
          <Search :size="20" />
          <input v-model="filters.search" type="search" :placeholder="t('searchPlaceholder')" />
        </span>
      </label>

      <button type="button" class="primary-action" @click="applyFilters">
        <Filter :size="20" />
        {{ t('filter') }}
      </button>
      <button type="button" class="outline-action" @click="exportCsv">
        <Download :size="20" />
        {{ t('export') }}
      </button>
      <button type="button" class="outline-action" @click="resetForm">
        <Plus :size="20" />
        {{ t('newStudent') }}
      </button>
    </section>

    <section class="dashboard-grid">
      <article
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :class="`tone-${card.tone}`"
      >
        <span class="metric-icon">
          <component :is="card.icon" :size="30" />
        </span>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US') }}</strong>
          <small>{{ card.helper }}</small>
        </div>
      </article>

      <article class="summary-card">
        <h2>
          {{ t('summary') }}
          <Info :size="15" />
        </h2>
        <div v-for="item in statusSummary" :key="item.status" class="summary-row">
          <span class="dot" :class="statusClass(item.status)"></span>
          <span>{{ label(item.status) }}</span>
          <progress :value="item.percent" max="100"></progress>
          <strong>{{ item.count }}</strong>
          <small>{{ item.percent }}%</small>
        </div>
        <div class="summary-total">
          <span>{{ t('total') }}</span>
          <strong>{{ total.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US') }}</strong>
        </div>
      </article>
    </section>

    <section v-if="showForm" class="form-card" aria-labelledby="student-form-title">
      <div class="section-title">
        <div>
          <h2 id="student-form-title">{{ isEditing ? t('formTitleEdit') : t('formTitleCreate') }}</h2>
          <span>{{ isEditing ? selectedStudent?.id : `${t('nextId')}: ${studentsStore.nextStudentId}` }}</span>
        </div>
        <button type="button" class="icon-button local" :aria-label="t('cancel')" @click="showForm = false">
          <X :size="20" />
        </button>
      </div>

      <form class="student-form" @submit.prevent="submitStudent">
        <label>
          {{ t('firstName') }}
          <input v-model.trim="form.firstName" required autocomplete="given-name" />
        </label>
        <label>
          {{ t('lastName') }}
          <input v-model.trim="form.lastName" required autocomplete="family-name" />
        </label>
        <label>
          {{ t('document') }}
          <input v-model.trim="form.documentId" required placeholder="CI-000000" />
        </label>
        <label>
          Email
          <input v-model.trim="form.email" required type="email" autocomplete="email" />
        </label>
        <label>
          {{ t('phone') }}
          <input v-model.trim="form.phone" autocomplete="tel" />
        </label>
        <label>
          {{ t('faculty') }}
          <select v-model="form.faculty">
            <option v-for="faculty in studentsStore.faculties" :key="faculty" :value="faculty">
              {{ faculty }}
            </option>
          </select>
        </label>
        <label>
          {{ t('program') }}
          <select v-model="form.program">
            <option v-for="program in studentsStore.programs" :key="program" :value="program">
              {{ program }}
            </option>
          </select>
        </label>
        <label>
          {{ t('academicStatus') }}
          <select v-model="form.academicStatus">
            <option value="Active">{{ label('Active') }}</option>
            <option value="At Risk">{{ label('At Risk') }}</option>
            <option value="Graduated">{{ label('Graduated') }}</option>
            <option value="Inactive">{{ label('Inactive') }}</option>
          </select>
        </label>
        <label>
          {{ t('enrollment') }}
          <select v-model="form.enrollmentStatus">
            <option value="Pending Payment">{{ label('Pending Payment') }}</option>
            <option value="Enrolled">{{ label('Enrolled') }}</option>
            <option value="Blocked">{{ label('Blocked') }}</option>
            <option value="Under Review">{{ label('Under Review') }}</option>
          </select>
        </label>
        <label>
          {{ t('term') }}
          <input v-model.trim="form.admissionTerm" required />
        </label>
        <label>
          {{ t('entryDate') }}
          <input v-model="form.admissionDate" required type="date" />
        </label>
        <label>
          {{ t('academicRisk') }}
          <select v-model="form.academicRisk">
            <option value="Low">{{ label('Low') }}</option>
            <option value="Medium">{{ label('Medium') }}</option>
            <option value="High">{{ label('High') }}</option>
          </select>
        </label>
        <label>
          GPA
          <input v-model.number="form.gpa" min="0" max="4" step="0.01" type="number" />
        </label>
        <label>
          {{ t('credits') }}
          <input v-model.number="form.creditsCompleted" min="0" type="number" />
        </label>
        <label>
          {{ t('advisor') }}
          <input v-model.trim="form.advisor" />
        </label>
        <label class="wide">
          {{ t('observation') }}
          <textarea v-model.trim="form.observation" rows="3"></textarea>
        </label>

        <div class="form-footer">
          <p aria-live="polite">{{ feedback }}</p>
          <button type="submit" class="primary-action">
            <CheckCircle2 :size="20" />
            {{ isEditing ? t('save') : t('create') }}
          </button>
        </div>
      </form>
    </section>

    <div class="content-grid">
      <section class="list-card" aria-labelledby="students-list-title">
        <div class="section-title">
          <div>
            <h2 id="students-list-title">{{ t('studentsList') }}</h2>
            <span>
              {{ t('showing') }} 1 {{ filteredStudents.length ? '-' : '' }}
              {{ filteredStudents.length }} {{ t('records') }}
            </span>
          </div>
          <div class="pagination" aria-label="Pagination">
            <button type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
          </div>
        </div>

        <div class="student-table" role="table" aria-label="Student records">
          <div class="student-row table-head" role="row">
            <span role="columnheader">{{ t('id') }}</span>
            <span role="columnheader">{{ t('name') }}</span>
            <span role="columnheader">{{ t('program') }}</span>
            <span role="columnheader">{{ t('faculty') }}</span>
            <span role="columnheader">{{ t('academicStatus') }}</span>
            <span role="columnheader">{{ t('enrollment') }}</span>
            <span role="columnheader">{{ t('lastUpdate') }}</span>
            <span role="columnheader">{{ t('actions') }}</span>
          </div>

          <button
            v-for="student in filteredStudents"
            :key="student.id"
            type="button"
            class="student-row"
            :class="{ selected: selectedStudent?.id === student.id }"
            role="row"
            @click="chooseStudent(student.id)"
          >
            <span role="cell">{{ student.id }}</span>
            <span role="cell">{{ student.firstName }} {{ student.lastName }}</span>
            <span role="cell">{{ student.program }}</span>
            <span role="cell">{{ student.faculty }}</span>
            <span role="cell">
              <mark class="pill" :class="statusClass(student.academicStatus)">
                {{ label(student.academicStatus) }}
              </mark>
            </span>
            <span role="cell">
              <mark class="pill" :class="statusClass(student.enrollmentStatus)">
                {{ label(student.enrollmentStatus) }}
              </mark>
            </span>
            <span role="cell">{{ formatDate(student.lastUpdated) }}</span>
            <span role="cell" class="row-actions">
              <span class="row-icon" :title="t('detail')"><Eye :size="17" /></span>
              <span class="row-icon" :title="t('edit')" @click.stop="editStudent(student)">
                <Pencil :size="17" />
              </span>
              <span class="row-icon" :title="t('history')" @click.stop="showHistory = true">
                <Clock3 :size="17" />
              </span>
            </span>
          </button>

          <p v-if="!filteredStudents.length" class="empty-state">{{ t('noResults') }}</p>
        </div>

        <footer class="identity-note">
          <ShieldCheck :size="22" />
          {{ t('duplicateSystem') }}
        </footer>
      </section>

      <aside v-if="selectedStudent" class="detail-card" aria-label="Student detail">
        <div class="detail-header">
          <h2>{{ t('detail') }}</h2>
          <Maximize2 :size="18" />
        </div>

        <div class="student-profile">
          <span class="profile-avatar">{{ selectedStudent.firstName[0] }}{{ selectedStudent.lastName[0] }}</span>
          <div>
            <span class="id-chip">{{ selectedStudent.id }}</span>
            <h3>{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</h3>
          </div>
          <mark class="valid-chip">
            <BadgeCheck :size="16" />
            {{ t('validIdentity') }}
          </mark>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>{{ t('program') }}</dt>
            <dd>{{ selectedStudent.program }}</dd>
          </div>
          <div>
            <dt>{{ t('institutionalEmail') }}</dt>
            <dd>{{ selectedStudent.email }}</dd>
          </div>
          <div>
            <dt>{{ t('faculty') }}</dt>
            <dd>{{ selectedStudent.faculty }}</dd>
          </div>
          <div>
            <dt>{{ t('lastUpdate') }}</dt>
            <dd>{{ formatDate(selectedStudent.lastUpdated) }}</dd>
          </div>
          <div>
            <dt>{{ t('academicStatus') }}</dt>
            <dd>
              <mark class="pill" :class="statusClass(selectedStudent.academicStatus)">
                {{ label(selectedStudent.academicStatus) }}
              </mark>
            </dd>
          </div>
          <div>
            <dt>{{ t('academicRisk') }}</dt>
            <dd>
              <mark class="pill" :class="statusClass(selectedStudent.academicRisk)">
                {{ label(selectedStudent.academicRisk) }}
              </mark>
            </dd>
          </div>
          <div>
            <dt>{{ t('enrollment') }}</dt>
            <dd>
              <mark class="pill" :class="statusClass(selectedStudent.enrollmentStatus)">
                {{ label(selectedStudent.enrollmentStatus) }}
              </mark>
            </dd>
          </div>
          <div>
            <dt>{{ t('entryDate') }}</dt>
            <dd>{{ formatDate(selectedStudent.admissionDate) }}</dd>
          </div>
        </dl>

        <section class="observation-box">
          <Info :size="21" />
          <div>
            <strong>{{ t('observation') }}:</strong>
            <p>{{ selectedStudent.observation }}</p>
          </div>
        </section>

        <section class="tracking-card">
          <h3>{{ t('tracking') }}</h3>
          <div class="tracking-line">
            <div
              v-for="(event, index) in selectedStudent.history.slice(0, 4)"
              :key="event.date + event.title"
              class="tracking-step"
            >
              <span>
                <CheckCircle2 :size="17" />
              </span>
              <strong>
                {{
                  [t('created'), t('validatedStep'), t('enrolledStep'), t('updatedStep')][index] ??
                  event.title
                }}
              </strong>
              <time>{{ formatDate(event.date) }}</time>
            </div>
          </div>
        </section>

        <section class="related-enrollments">
          <h3>{{ t('relatedEnrollments') }}</h3>
          <ul v-if="selectedStudent.enrollments?.length">
            <li v-for="enrollment in selectedStudent.enrollments" :key="enrollment.id">
              <span>
                <strong>{{ enrollment.id }}</strong>
                {{ enrollment.academicPeriod }} · {{ enrollment.program }}
              </span>
              <mark class="pill" :class="statusClass(enrollment.status)">
                {{ label(enrollment.status) }}
              </mark>
              <small>
                {{ enrollment.subjects.length }} · {{ enrollment.totalCredits }} {{ t('credits') }}
              </small>
            </li>
          </ul>
          <p v-else>{{ t('noEnrollments') }}</p>
        </section>

        <button type="button" class="history-button" @click="showHistory = !showHistory">
          <List :size="20" />
          {{ t('fullHistory') }}
        </button>

        <section v-if="showHistory" class="history-list">
          <h3>{{ t('history') }}</h3>
          <ol>
            <li v-for="event in selectedStudent.history" :key="`${event.date}-${event.title}`">
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
.students-page {
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

.page-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 1.05rem;
}

.filters-card,
.metric-card,
.summary-card,
.list-card,
.detail-card,
.form-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.filters-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
  padding: 18px 20px;
}

.search-field {
  min-width: min(100%, 280px);
}

label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--text);
  background: var(--panel);
}

textarea {
  padding-block: 10px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: 3px solid color-mix(in srgb, var(--primary) 24%, transparent);
  border-color: var(--primary);
}

.search-field span {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--panel);
}

.search-field input {
  border: 0;
  padding: 0;
}

.primary-action,
.outline-action,
.history-button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 18px;
  font-weight: 850;
  white-space: nowrap;
}

.filters-card .primary-action,
.filters-card .outline-action {
  width: 100%;
}

.primary-action {
  border: 0;
  color: #ffffff;
  background: var(--primary);
  box-shadow: 0 12px 22px color-mix(in srgb, var(--primary) 24%, transparent);
}

.outline-action,
.history-button {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: transparent;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.metric-card {
  min-height: 134px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px;
}

.metric-icon {
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
}

.metric-icon svg {
  display: block;
  width: 30px;
  height: 30px;
}

.tone-blue .metric-icon {
  background: #1475f8;
}

.tone-green .metric-icon {
  background: #22b85f;
}

.tone-amber .metric-icon {
  background: #ff9f1c;
}

.tone-red .metric-icon {
  background: #ff5757;
}

.tone-violet .metric-icon {
  background: #7c7cff;
}

.metric-card div > span,
.metric-card small {
  display: block;
  color: var(--muted);
}

.metric-card strong {
  display: block;
  margin: 6px 0;
  color: var(--text);
  font-size: 1.75rem;
}

.summary-card {
  display: grid;
  grid-column: span 2;
  gap: 12px;
  padding: 16px 18px;
}

.summary-card h2,
.section-title h2,
.detail-header h2,
.tracking-card h3,
.history-list h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.summary-row {
  display: grid;
  grid-template-columns: 10px minmax(72px, 1fr) minmax(80px, 1.4fr) 44px 44px;
  gap: 10px;
  align-items: center;
  color: var(--muted);
  font-size: 0.82rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.dot.at-risk {
  background: var(--warning);
}

.dot.graduated {
  background: var(--primary);
}

.dot.inactive {
  background: #7b8498;
}

progress {
  width: 100%;
  height: 7px;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: var(--line);
}

progress::-webkit-progress-bar {
  background: var(--line);
}

progress::-webkit-progress-value {
  border-radius: 999px;
  background: var(--success);
}

.summary-row:nth-of-type(3) progress::-webkit-progress-value {
  background: var(--warning);
}

.summary-row:nth-of-type(4) progress::-webkit-progress-value {
  background: var(--primary);
}

.summary-row:nth-of-type(5) progress::-webkit-progress-value {
  background: #7b8498;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  padding-top: 10px;
  color: var(--text);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 480px);
  gap: 18px;
  align-items: start;
}

.list-card,
.detail-card,
.form-card {
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

.section-title span {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.86rem;
}

.pagination {
  display: flex;
  gap: 8px;
}

.pagination button,
.row-icon,
.icon-button.local {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--primary);
  background: var(--panel);
}

.student-table {
  overflow-x: auto;
}

.student-row {
  width: 100%;
  min-width: 1050px;
  display: grid;
  grid-template-columns: 132px 1fr 1.25fr 1.1fr 116px 126px 122px 112px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.student-row:not(.table-head):hover,
.student-row.selected {
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
  color: #087c35;
  background: #dff4e8;
  font-size: 0.78rem;
  font-weight: 850;
}

.pill.pending-payment,
.pill.at-risk,
.pill.medium {
  color: #d87500;
  background: #fff1d8;
}

.pill.graduated,
.pill.under-review,
.pill.payment-confirmed {
  color: #0969ee;
  background: #e7f1ff;
}

.pill.inactive,
.pill.blocked,
.pill.cancelled,
.pill.high {
  color: #dc2434;
  background: #ffe2e5;
}

.pill.low {
  color: #087c35;
  background: #dff4e8;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.empty-state,
.identity-note {
  color: var(--muted);
}

.empty-state {
  margin: 18px 10px;
}

.identity-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  font-size: 0.9rem;
}

.student-profile {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  gap: 14px;
  align-items: center;
}

.profile-avatar {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(135deg, #8bbcff, #d5e7ff);
  font-weight: 850;
}

.id-chip,
.valid-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 7px;
  padding: 6px 10px;
  font-weight: 850;
}

.id-chip {
  color: var(--primary);
  background: var(--primary-soft);
}

.valid-chip {
  color: #087c35;
  background: #e3f7ea;
}

.student-profile h3 {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 1.6rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin: 18px 0;
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

.observation-box {
  display: flex;
  gap: 12px;
  border: 1px solid color-mix(in srgb, var(--warning) 52%, var(--line));
  border-radius: 8px;
  padding: 14px;
  color: #8a5700;
  background: color-mix(in srgb, var(--warning) 12%, var(--panel));
}

.observation-box p {
  margin: 5px 0 0;
  color: var(--text);
  line-height: 1.45;
}

.tracking-card {
  margin-top: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.related-enrollments {
  margin-top: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.related-enrollments h3 {
  margin: 0 0 12px;
  color: var(--text);
  font-size: 1rem;
}

.related-enrollments ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.related-enrollments li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 10px;
  align-items: center;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
}

.related-enrollments li:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.related-enrollments span,
.related-enrollments small {
  display: block;
}

.related-enrollments small {
  grid-column: 1 / -1;
  color: var(--muted);
}

.related-enrollments p {
  margin: 0;
  color: var(--muted);
}

.tracking-line {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.tracking-line::before {
  position: absolute;
  top: 14px;
  right: 10%;
  left: 10%;
  height: 3px;
  border-radius: 999px;
  background: var(--success);
  content: '';
}

.tracking-step {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 8px;
  color: var(--text);
  text-align: center;
  font-size: 0.78rem;
}

.tracking-step span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: var(--success);
}

.tracking-step time {
  color: var(--muted);
}

.history-button {
  width: 100%;
  margin-top: 14px;
}

.history-list {
  margin-top: 16px;
}

.history-list ol {
  display: grid;
  gap: 12px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.history-list li {
  display: grid;
  gap: 4px;
  border-left: 3px solid var(--primary);
  padding-left: 12px;
}

.history-list time,
.history-list span {
  color: var(--muted);
  font-size: 0.86rem;
}

.form-card {
  border-color: color-mix(in srgb, var(--primary) 42%, var(--line));
}

.student-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.student-form .wide {
  grid-column: span 2;
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
  color: var(--danger);
  font-weight: 800;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .student-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .students-page {
    padding: 20px;
  }

  .filters-card,
  .dashboard-grid,
  .student-form,
  .detail-grid,
  .tracking-line {
    grid-template-columns: 1fr;
  }

  .search-field,
  .summary-card,
  .student-form .wide {
    grid-column: auto;
  }

  .section-title,
  .form-footer,
  .student-profile {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .tracking-line::before {
    display: none;
  }
}
</style>


