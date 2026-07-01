<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  CheckCircle2,
  Clock3,
  FileClock,
  FilePenLine,
  GraduationCap,
  Search,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from '@lucide/vue'
import { useCoursesStore } from '@/stores/courses'
import { useGradesStore } from '@/stores/grades'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const coursesStore = useCoursesStore()
const gradesStore = useGradesStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Notas y Expediente Académico',
    subtitle: 'Registro de calificaciones, promedio simple e historial académico',
    register: 'Registrar calificación',
    studentCourse: 'Estudiante y asignatura',
    score: 'Calificación',
    reason: 'Motivo / seguimiento',
    save: 'Guardar nota',
    complete: 'Completar expediente',
    search: 'Buscar estudiante, asignatura o profesor',
    status: 'Estado',
    allStatuses: 'Todos los estados',
    pending: 'Pendientes',
    passed: 'Aprobadas',
    failed: 'Reprobadas',
    completed: 'Completadas',
    average: 'Promedio simple',
    records: 'Registros',
    student: 'Estudiante',
    course: 'Asignatura',
    teacher: 'Profesor',
    detail: 'Detalle de nota',
    history: 'Historial académico',
    transcript: 'Expediente del estudiante',
    noRecords: 'No hay notas para los filtros seleccionados.',
    noGradable: 'Asigna estudiantes a grupos para poder registrar calificaciones.',
    traceRequired: 'Para modificar una nota existente debes escribir el motivo.',
    saved: 'Calificación guardada correctamente.',
    selectStudent: 'Seleccionar estudiante',
  },
  en: {
    title: 'Grades and Academic Record',
    subtitle: 'Grade registration, simple average, and academic history',
    register: 'Register grade',
    studentCourse: 'Student and course',
    score: 'Grade',
    reason: 'Reason / tracking',
    save: 'Save grade',
    complete: 'Complete record',
    search: 'Search student, course, or teacher',
    status: 'Status',
    allStatuses: 'All statuses',
    pending: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
    completed: 'Completed',
    average: 'Simple average',
    records: 'Records',
    student: 'Student',
    course: 'Course',
    teacher: 'Teacher',
    detail: 'Grade detail',
    history: 'Academic history',
    transcript: 'Student transcript',
    noRecords: 'No grade records match the selected filters.',
    noGradable: 'Assign students to groups before registering grades.',
    traceRequired: 'To modify an existing grade, a reason is required.',
    saved: 'Grade saved successfully.',
    selectStudent: 'Select student',
  },
}

const statusLabels = {
  es: {
    'Pending Grade': 'Nota pendiente',
    Passed: 'Aprobado',
    Failed: 'Reprobado',
    Completed: 'Completado',
  },
  en: {
    'Pending Grade': 'Pending Grade',
    Passed: 'Passed',
    Failed: 'Failed',
    Completed: 'Completed',
  },
}

const form = reactive({
  studentCourseKey: '',
  score: '',
  reason: '',
})
const filters = reactive({
  search: '',
  status: '',
})
const selectedTranscriptStudentId = ref(studentsStore.students[0]?.id ?? '')
const feedback = ref('')

const selectedRecord = computed(() => gradesStore.selectedRecord)
const transcript = computed(() => gradesStore.transcriptForStudent(selectedTranscriptStudentId.value))

const filteredRecords = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return gradesStore.gradeRecords.filter((record) => {
    const student = findStudent(record.studentId)
    const matchesStatus = !filters.status || record.status === filters.status
    const matchesSearch =
      !query ||
      [
        record.id,
        record.subjectCode,
        record.subjectName,
        record.teacher,
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
    label: t('records'),
    value: gradesStore.gradeRecords.length,
    icon: FilePenLine,
    tone: 'blue',
  },
  {
    label: t('pending'),
    value: gradesStore.pendingCount,
    icon: FileClock,
    tone: 'amber',
  },
  {
    label: t('passed'),
    value: gradesStore.passedCount,
    icon: CheckCircle2,
    tone: 'green',
  },
  {
    label: t('failed'),
    value: gradesStore.failedCount,
    icon: TriangleAlert,
    tone: 'red',
  },
  {
    label: t('average'),
    value: gradesStore.gradeAverage,
    icon: TrendingUp,
    tone: 'violet',
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

function findCourse(courseId) {
  return coursesStore.courses.find((course) => course.id === courseId)
}

function studentName(studentId) {
  const student = findStudent(studentId)

  return student ? `${student.firstName} ${student.lastName}` : studentId
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

function parseStudentCourseKey(value) {
  const [studentId, courseId] = value.split('|')

  return { studentId, courseId }
}

function saveGrade() {
  const { studentId, courseId } = parseStudentCourseKey(form.studentCourseKey)
  const result = gradesStore.upsertGrade({
    studentId,
    courseId,
    score: form.score,
    reason: form.reason,
  })

  feedback.value = result.ok ? t('saved') : result.message

  if (result.ok) {
    selectedTranscriptStudentId.value = studentId
    form.reason = ''
  }
}

function completeSelectedRecord() {
  if (!selectedRecord.value) return

  const result = gradesStore.completeRecord(selectedRecord.value.id, form.reason)

  feedback.value = result.ok ? t('saved') : result.message
  if (result.ok) form.reason = ''
}

function selectRecord(recordId) {
  gradesStore.selectRecord(recordId)
  const record = gradesStore.selectedRecord

  if (!record) return

  form.studentCourseKey = `${record.studentId}|${record.courseId}`
  form.score = record.score ?? ''
  selectedTranscriptStudentId.value = record.studentId
}

watch(
  () => gradesStore.gradableStudents,
  (items) => {
    if (!form.studentCourseKey && items.length) {
      form.studentCourseKey = `${items[0].studentId}|${items[0].courseId}`
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="grades-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="form-card">
      <div class="section-title">
        <div>
          <h2>{{ t('register') }}</h2>
          <span>{{ t('traceRequired') }}</span>
        </div>
      </div>

      <form class="grade-form" @submit.prevent="saveGrade">
        <label>
          {{ t('studentCourse') }}
          <select v-model="form.studentCourseKey" required>
            <option
              v-for="item in gradesStore.gradableStudents"
              :key="`${item.studentId}-${item.courseId}`"
              :value="`${item.studentId}|${item.courseId}`"
            >
              {{ item.label }}
            </option>
          </select>
        </label>

        <label>
          {{ t('score') }}
          <input v-model="form.score" max="100" min="0" step="0.1" type="number" />
        </label>

        <label class="wide">
          {{ t('reason') }}
          <input v-model.trim="form.reason" placeholder="Required when changing an existing grade" />
        </label>

        <div class="form-footer">
          <p aria-live="polite">{{ feedback || (!gradesStore.gradableStudents.length ? t('noGradable') : '') }}</p>
          <div class="form-actions">
            <button type="submit" class="primary-action" :disabled="!gradesStore.gradableStudents.length">
              <ShieldCheck :size="20" />
              {{ t('save') }}
            </button>
            <button
              type="button"
              class="outline-action"
              :disabled="!selectedRecord"
              @click="completeSelectedRecord"
            >
              {{ t('complete') }}
            </button>
          </div>
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
              <option value="Pending Grade">{{ label('Pending Grade') }}</option>
              <option value="Passed">{{ label('Passed') }}</option>
              <option value="Failed">{{ label('Failed') }}</option>
              <option value="Completed">{{ label('Completed') }}</option>
            </select>
          </label>
        </div>

        <div class="grade-table" role="table" aria-label="Grade records">
          <div class="grade-row table-head" role="row">
            <span>ID</span>
            <span>{{ t('student') }}</span>
            <span>{{ t('course') }}</span>
            <span>{{ t('teacher') }}</span>
            <span>{{ t('score') }}</span>
            <span>{{ t('status') }}</span>
          </div>

          <button
            v-for="record in filteredRecords"
            :key="record.id"
            type="button"
            class="grade-row"
            :class="{ selected: selectedRecord?.id === record.id }"
            @click="selectRecord(record.id)"
          >
            <span>{{ record.id }}</span>
            <span>{{ studentName(record.studentId) }}</span>
            <span>
              <strong>{{ record.subjectName }}</strong>
              <small>{{ record.subjectCode }} · {{ record.group }}</small>
            </span>
            <span>{{ record.teacher }}</span>
            <span>{{ record.score ?? '-' }}</span>
            <span>
              <mark class="pill" :class="statusClass(record.status)">
                {{ label(record.status) }}
              </mark>
            </span>
          </button>

          <p v-if="!filteredRecords.length" class="empty-state">{{ t('noRecords') }}</p>
        </div>
      </section>

      <aside v-if="selectedRecord" class="detail-card">
        <div class="detail-header">
          <h2>{{ t('detail') }}</h2>
          <mark class="pill" :class="statusClass(selectedRecord.status)">
            {{ label(selectedRecord.status) }}
          </mark>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>{{ t('student') }}</dt>
            <dd>{{ studentName(selectedRecord.studentId) }}</dd>
          </div>
          <div>
            <dt>{{ t('course') }}</dt>
            <dd>{{ selectedRecord.subjectCode }} · {{ selectedRecord.subjectName }}</dd>
          </div>
          <div>
            <dt>{{ t('teacher') }}</dt>
            <dd>{{ selectedRecord.teacher }}</dd>
          </div>
          <div>
            <dt>{{ t('score') }}</dt>
            <dd>{{ selectedRecord.score ?? '-' }}</dd>
          </div>
        </dl>

        <section class="history-list">
          <h3>
            <Clock3 :size="18" />
            {{ t('history') }}
          </h3>
          <ol>
            <li v-for="event in selectedRecord.history" :key="`${event.date}-${event.title}`">
              <time>{{ formatDate(event.date) }}</time>
              <strong>{{ event.title }}</strong>
              <span>{{ event.detail }}</span>
            </li>
          </ol>
        </section>
      </aside>
    </div>

    <section class="transcript-card">
      <div class="section-title">
        <div>
          <h2>
            <GraduationCap :size="20" />
            {{ t('transcript') }}
          </h2>
        </div>
        <label>
          {{ t('selectStudent') }}
          <select v-model="selectedTranscriptStudentId">
            <option v-for="student in studentsStore.students" :key="student.id" :value="student.id">
              {{ student.id }} · {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </label>
      </div>

      <div class="transcript-summary">
        <span>{{ studentName(selectedTranscriptStudentId) }}</span>
        <strong>{{ t('average') }}: {{ transcript.average }}</strong>
      </div>

      <div class="transcript-list">
        <article v-for="record in transcript.records" :key="record.id">
          <span>
            <strong>{{ record.subjectCode }} · {{ record.subjectName }}</strong>
            {{ findCourse(record.courseId)?.group }} · {{ record.teacher }}
          </span>
          <mark class="pill" :class="statusClass(record.status)">
            {{ record.score ?? '-' }} · {{ label(record.status) }}
          </mark>
        </article>
        <p v-if="!transcript.records.length" class="empty-state">{{ t('noRecords') }}</p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.grades-page {
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
.detail-card,
.transcript-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.form-card,
.list-card,
.detail-card,
.transcript-card {
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
.history-list h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.grade-form {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) 140px minmax(260px, 1fr);
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
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

.form-actions {
  display: flex;
  gap: 10px;
}

.primary-action,
.outline-action {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 16px;
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

.tone-amber .metric-icon {
  background: #ff9f1c;
}

.tone-green .metric-icon {
  background: #22b85f;
}

.tone-red .metric-icon {
  background: #ff5757;
}

.tone-violet .metric-icon {
  background: #7c7cff;
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
  grid-template-columns: minmax(0, 1fr) minmax(360px, 480px);
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

.grade-table {
  overflow-x: auto;
}

.grade-row {
  width: 100%;
  min-width: 880px;
  display: grid;
  grid-template-columns: 132px 1.1fr 1.4fr 1fr 100px 140px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.grade-row:not(.table-head):hover,
.grade-row.selected {
  background: var(--primary-soft);
  outline: 1px solid color-mix(in srgb, var(--primary) 32%, transparent);
}

.grade-row strong,
.grade-row small {
  display: block;
}

.grade-row small {
  margin-top: 4px;
  color: var(--muted);
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

.pill.passed,
.pill.completed {
  color: #087c35;
  background: #dff4e8;
}

.pill.failed {
  color: #dc2434;
  background: #ffe2e5;
}

.pill.pending-grade {
  color: #d87500;
  background: #fff1d8;
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

.history-list ol {
  display: grid;
  gap: 10px;
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
}

.transcript-card label {
  min-width: min(340px, 100%);
}

.transcript-summary {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  color: var(--text);
  background: var(--panel-soft);
}

.transcript-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.transcript-list article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 10px;
}

.transcript-list span,
.transcript-list strong {
  display: block;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .grade-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .grades-page {
    padding: 20px;
  }

  .grade-form,
  .filters-card,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .form-footer,
  .section-title,
  .detail-header,
  .transcript-summary,
  .transcript-list article {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
