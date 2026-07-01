<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DoorOpen,
  GraduationCap,
  Plus,
  Search,
  UserPlus,
  Users,
} from '@lucide/vue'
import { useCoursesStore } from '@/stores/courses'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const coursesStore = useCoursesStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Asignaturas y Profesores',
    subtitle: 'Gestión de grupos, docentes, cupos y estudiantes matriculados',
    create: 'Crear asignatura',
    subject: 'Asignatura',
    teacher: 'Profesor',
    group: 'Grupo',
    capacity: 'Cupo',
    program: 'Carrera',
    enrolled: 'Inscritos',
    available: 'Disponibles',
    fullGroups: 'Grupos llenos',
    totalCourses: 'Grupos creados',
    search: 'Buscar asignatura, profesor o grupo',
    courseList: 'Lista por grupo',
    detail: 'Detalle del grupo',
    assignedStudents: 'Estudiantes asignados',
    eligibleStudents: 'Estudiantes elegibles',
    assign: 'Asignar',
    remove: 'Quitar',
    noCourses: 'No hay grupos creados todavía.',
    noSubjects: 'Primero valida pagos para tener matrículas inscritas y asignaturas disponibles.',
    noEligible: 'No hay estudiantes elegibles pendientes para este grupo.',
    created: 'Grupo creado correctamente.',
    history: 'Historial',
    seats: 'cupos',
  },
  en: {
    title: 'Courses and Teachers',
    subtitle: 'Manage groups, teachers, capacity, and enrolled students',
    create: 'Create course',
    subject: 'Course',
    teacher: 'Teacher',
    group: 'Group',
    capacity: 'Capacity',
    program: 'Program',
    enrolled: 'Enrolled',
    available: 'Available',
    fullGroups: 'Full groups',
    totalCourses: 'Created groups',
    search: 'Search course, teacher, or group',
    courseList: 'Group list',
    detail: 'Group detail',
    assignedStudents: 'Assigned students',
    eligibleStudents: 'Eligible students',
    assign: 'Assign',
    remove: 'Remove',
    noCourses: 'No groups have been created yet.',
    noSubjects: 'Validate payments first to get enrolled students and available subjects.',
    noEligible: 'No pending eligible students for this group.',
    created: 'Course group created successfully.',
    history: 'History',
    seats: 'seats',
  },
}

const form = reactive({
  subjectCode: '',
  teacher: coursesStore.teachers[0],
  group: 'A',
  capacity: 30,
})
const filters = reactive({
  search: '',
})
const feedback = ref('')
const selectedStudentId = ref('')

const selectedCourse = computed(() => coursesStore.selectedCourse)

const filteredCourses = computed(() => {
  const query = filters.search.trim().toLowerCase()

  if (!query) return coursesStore.courses

  return coursesStore.courses.filter((course) =>
    [course.id, course.subjectCode, course.subjectName, course.teacher, course.group, course.program]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const selectedEligibleStudents = computed(() => {
  if (!selectedCourse.value) return []

  return coursesStore
    .eligibleStudentsForCourse(selectedCourse.value.id)
    .filter((student) => !selectedCourse.value.studentIds.includes(student.id))
})

const assignedStudents = computed(() => {
  if (!selectedCourse.value) return []

  return selectedCourse.value.studentIds
    .map((studentId) => studentsStore.students.find((student) => student.id === studentId))
    .filter(Boolean)
})

const metricCards = computed(() => [
  {
    label: t('totalCourses'),
    value: coursesStore.courses.length,
    icon: BookOpenCheck,
    tone: 'blue',
  },
  {
    label: t('capacity'),
    value: coursesStore.totalCapacity,
    icon: DoorOpen,
    tone: 'violet',
  },
  {
    label: t('enrolled'),
    value: coursesStore.totalAssigned,
    icon: Users,
    tone: 'green',
  },
  {
    label: t('available'),
    value: coursesStore.availableSeats,
    icon: ClipboardList,
    tone: 'amber',
  },
  {
    label: t('fullGroups'),
    value: coursesStore.fullCoursesCount,
    icon: CheckCircle2,
    tone: 'red',
  },
])

function t(key) {
  return copy[ui.language][key]
}

function subjectLabel(code) {
  const subject = coursesStore.enrolledSubjectOptions.find((item) => item.code === code)

  return subject ? `${subject.code} · ${subject.name}` : code
}

function studentName(student) {
  return `${student.firstName} ${student.lastName}`
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

function createCourse() {
  const result = coursesStore.createCourse({ ...form })

  feedback.value = result.ok ? t('created') : result.message
}

function selectCourse(courseId) {
  coursesStore.selectCourse(courseId)
  selectedStudentId.value = selectedEligibleStudents.value[0]?.id ?? ''
}

function assignSelectedStudent() {
  if (!selectedCourse.value || !selectedStudentId.value) return

  const result = coursesStore.assignStudent(selectedCourse.value.id, selectedStudentId.value)

  feedback.value = result.ok ? '' : result.message
  selectedStudentId.value = selectedEligibleStudents.value[0]?.id ?? ''
}

watch(
  () => coursesStore.enrolledSubjectOptions,
  (subjects) => {
    if (!form.subjectCode && subjects.length) form.subjectCode = subjects[0].code
  },
  { immediate: true },
)

watch(selectedCourse, () => {
  selectedStudentId.value = selectedEligibleStudents.value[0]?.id ?? ''
})
</script>

<template>
  <section class="courses-page">
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
          <span>{{ t('noSubjects') }}</span>
        </div>
      </div>

      <form class="course-form" @submit.prevent="createCourse">
        <label>
          {{ t('subject') }}
          <select v-model="form.subjectCode" required>
            <option
              v-for="subject in coursesStore.enrolledSubjectOptions"
              :key="subject.code"
              :value="subject.code"
            >
              {{ subject.code }} · {{ subject.name }} · {{ subject.program }}
            </option>
          </select>
        </label>

        <label>
          {{ t('teacher') }}
          <select v-model="form.teacher" required>
            <option v-for="teacher in coursesStore.teachers" :key="teacher" :value="teacher">
              {{ teacher }}
            </option>
          </select>
        </label>

        <label>
          {{ t('group') }}
          <input v-model.trim="form.group" required placeholder="A" />
        </label>

        <label>
          {{ t('capacity') }}
          <input v-model.number="form.capacity" min="1" type="number" required />
        </label>

        <div class="form-footer">
          <p aria-live="polite">{{ feedback }}</p>
          <button
            type="submit"
            class="primary-action"
            :disabled="!coursesStore.enrolledSubjectOptions.length"
          >
            <Plus :size="20" />
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
        </div>

        <div class="course-table" role="table" aria-label="Course records">
          <div class="course-row table-head" role="row">
            <span>ID</span>
            <span>{{ t('subject') }}</span>
            <span>{{ t('teacher') }}</span>
            <span>{{ t('group') }}</span>
            <span>{{ t('capacity') }}</span>
            <span>{{ t('enrolled') }}</span>
          </div>

          <button
            v-for="course in filteredCourses"
            :key="course.id"
            type="button"
            class="course-row"
            :class="{ selected: selectedCourse?.id === course.id }"
            @click="selectCourse(course.id)"
          >
            <span>{{ course.id }}</span>
            <span>
              <strong>{{ course.subjectName }}</strong>
              <small>{{ course.subjectCode }} · {{ course.program }}</small>
            </span>
            <span>{{ course.teacher }}</span>
            <span>{{ course.group }}</span>
            <span>{{ course.capacity }}</span>
            <span>{{ course.studentIds.length }}</span>
          </button>

          <p v-if="!filteredCourses.length" class="empty-state">{{ t('noCourses') }}</p>
        </div>
      </section>

      <aside v-if="selectedCourse" class="detail-card">
        <div class="detail-header">
          <h2>{{ t('detail') }}</h2>
          <mark class="capacity-pill">
            {{ selectedCourse.studentIds.length }} / {{ selectedCourse.capacity }}
            {{ t('seats') }}
          </mark>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>{{ t('subject') }}</dt>
            <dd>{{ subjectLabel(selectedCourse.subjectCode) }}</dd>
          </div>
          <div>
            <dt>{{ t('teacher') }}</dt>
            <dd>{{ selectedCourse.teacher }}</dd>
          </div>
          <div>
            <dt>{{ t('group') }}</dt>
            <dd>{{ selectedCourse.group }}</dd>
          </div>
          <div>
            <dt>{{ t('program') }}</dt>
            <dd>{{ selectedCourse.program }}</dd>
          </div>
        </dl>

        <section class="assign-card">
          <h3>
            <UserPlus :size="18" />
            {{ t('eligibleStudents') }}
          </h3>
          <div class="assign-row">
            <select v-model="selectedStudentId" :disabled="!selectedEligibleStudents.length">
              <option
                v-for="student in selectedEligibleStudents"
                :key="student.id"
                :value="student.id"
              >
                {{ student.id }} · {{ studentName(student) }}
              </option>
            </select>
            <button
              type="button"
              class="primary-action"
              :disabled="!selectedStudentId"
              @click="assignSelectedStudent"
            >
              {{ t('assign') }}
            </button>
          </div>
          <p v-if="!selectedEligibleStudents.length">{{ t('noEligible') }}</p>
        </section>

        <section class="students-card">
          <h3>
            <GraduationCap :size="18" />
            {{ t('assignedStudents') }}
          </h3>
          <ul v-if="assignedStudents.length">
            <li v-for="student in assignedStudents" :key="student.id">
              <span>
                <strong>{{ studentName(student) }}</strong>
                {{ student.id }} · {{ student.email }}
              </span>
              <button
                type="button"
                class="ghost-action"
                @click="coursesStore.removeStudent(selectedCourse.id, student.id)"
              >
                {{ t('remove') }}
              </button>
            </li>
          </ul>
          <p v-else>{{ t('noEligible') }}</p>
        </section>

        <section class="history-list">
          <h3>
            <Clock3 :size="18" />
            {{ t('history') }}
          </h3>
          <ol>
            <li v-for="event in selectedCourse.history" :key="`${event.date}-${event.title}`">
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
.courses-page {
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
.empty-state,
.assign-card p,
.students-card p {
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
.assign-card h3,
.students-card h3,
.history-list h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.course-form {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) minmax(180px, 1fr) 120px 120px;
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

.primary-action,
.ghost-action {
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

.ghost-action {
  border: 1px solid var(--line);
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

.tone-violet .metric-icon {
  background: #7c7cff;
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

.course-table {
  overflow-x: auto;
}

.course-row {
  width: 100%;
  min-width: 820px;
  display: grid;
  grid-template-columns: 132px 1.6fr 1fr 90px 90px 90px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.course-row:not(.table-head):hover,
.course-row.selected {
  background: var(--primary-soft);
  outline: 1px solid color-mix(in srgb, var(--primary) 32%, transparent);
}

.course-row strong,
.course-row small {
  display: block;
}

.course-row small {
  margin-top: 4px;
  color: var(--muted);
}

.table-head {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 850;
}

.capacity-pill {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border-radius: 6px;
  padding: 0 10px;
  color: #087c35;
  background: #dff4e8;
  font-size: 0.78rem;
  font-weight: 850;
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

.assign-card,
.students-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.assign-card {
  margin-bottom: 14px;
}

.assign-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-top: 12px;
}

.students-card ul,
.history-list ol {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.students-card li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

.students-card span,
.students-card strong {
  display: block;
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

.history-list time,
.history-list span {
  color: var(--muted);
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .course-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .courses-page {
    padding: 20px;
  }

  .course-form,
  .detail-grid,
  .assign-row {
    grid-template-columns: 1fr;
  }

  .form-footer,
  .section-title,
  .detail-header,
  .students-card li {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
