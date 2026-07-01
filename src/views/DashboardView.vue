<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Filter,
  Gauge,
  ReceiptText,
  ShieldAlert,
  Users,
} from '@lucide/vue'
import { useCertificatesStore } from '@/stores/certificates'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useGradesStore } from '@/stores/grades'
import { usePaymentsStore } from '@/stores/payments'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'
import { api, unwrapData } from '@/services/api'

const certificatesStore = useCertificatesStore()
const coursesStore = useCoursesStore()
const enrollmentsStore = useEnrollmentsStore()
const gradesStore = useGradesStore()
const paymentsStore = usePaymentsStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const filters = reactive({
  faculty: '',
  program: '',
  academicYear: '2026',
})
const dashboardMetrics = ref(null)

const copy = {
  es: {
    title: 'Panel de Indicadores Académicos',
    subtitle: 'Sistema de apoyo a la gestión universitaria',
    faculty: 'Facultad',
    program: 'Carrera',
    academicYear: 'Curso académico',
    allFaculties: 'Todas las facultades',
    allPrograms: 'Todas las carreras',
    filter: 'Filtrar',
    totalStudents: 'Estudiantes',
    activeEnrollments: 'Matrículas activas',
    pendingPayments: 'Pagos pendientes',
    availableCourses: 'Cursos con cupos',
    certificatesIssued: 'Certificados emitidos',
    academicIssues: 'Procesos pendientes',
    completionTime: 'Tiempo promedio de matrícula',
    manualValidations: 'Validaciones manuales',
    duplicates: 'Duplicados detectados',
    certificateTime: 'Tiempo generación certificado',
    days: 'días',
    minutes: 'min',
    enrollmentTrend: 'Matrículas por período',
    issuesByProgram: 'Procesos pendientes por carrera',
    indicatorsByProgram: 'Indicadores por carrera',
    operationalProcesses: 'Procesos operativos',
    recentCertificates: 'Certificados recientes',
    researchMetrics: 'Indicadores de investigación',
    module: 'Módulo',
    pending: 'Pendientes',
    completed: 'Completados',
    active: 'Activas',
    seats: 'Cupos',
    issuedTo: 'Emitido a',
    type: 'Tipo',
    date: 'Fecha',
    noCertificates: 'Aún no hay certificados generados.',
  },
  en: {
    title: 'Academic Indicators Panel',
    subtitle: 'Support system for university management',
    faculty: 'Faculty',
    program: 'Program',
    academicYear: 'Academic year',
    allFaculties: 'All faculties',
    allPrograms: 'All programs',
    filter: 'Filter',
    totalStudents: 'Students',
    activeEnrollments: 'Active enrollments',
    pendingPayments: 'Pending payments',
    availableCourses: 'Courses with seats',
    certificatesIssued: 'Certificates issued',
    academicIssues: 'Pending processes',
    completionTime: 'Average enrollment time',
    manualValidations: 'Manual validations',
    duplicates: 'Duplicates detected',
    certificateTime: 'Certificate generation time',
    days: 'days',
    minutes: 'min',
    enrollmentTrend: 'Enrollments by period',
    issuesByProgram: 'Pending processes by program',
    indicatorsByProgram: 'Indicators by program',
    operationalProcesses: 'Operational processes',
    recentCertificates: 'Recent certificates',
    researchMetrics: 'Research metrics',
    module: 'Module',
    pending: 'Pending',
    completed: 'Completed',
    active: 'Active',
    seats: 'Seats',
    issuedTo: 'Issued to',
    type: 'Type',
    date: 'Date',
    noCertificates: 'No certificates have been generated yet.',
  },
}

const filteredStudents = computed(() =>
  studentsStore.students.filter((student) => {
    const matchesFaculty = !filters.faculty || student.faculty === filters.faculty
    const matchesProgram = !filters.program || student.program === filters.program

    return matchesFaculty && matchesProgram
  }),
)

const selectedFacultyId = computed(
  () => studentsStore.students.find((student) => student.faculty === filters.faculty)?.facultyId,
)
const selectedProgramId = computed(
  () => studentsStore.students.find((student) => student.program === filters.program)?.programId,
)

const failedOrPendingAcademicProcesses = computed(
  () =>
    gradesStore.pendingCount +
    gradesStore.failedCount +
    enrollmentsStore.draftCount +
    enrollmentsStore.pendingPaymentCount,
)

const coursesWithAvailableSeats = computed(
  () => coursesStore.courses.filter((course) => course.studentIds.length < course.capacity).length,
)

const duplicateRecords = computed(() => {
  const seen = new Set()
  let duplicates = 0

  studentsStore.students.forEach((student) => {
    const key = `${student.documentId}|${student.email}`.toLowerCase()

    if (seen.has(key)) duplicates += 1
    seen.add(key)
  })

  return duplicates
})

const averageEnrollmentCompletionTime = computed(() => {
  const completed = enrollmentsStore.enrollments.filter(
    (enrollment) => enrollment.status === 'Enrolled',
  )

  if (!completed.length) return 0

  const totalDays = completed.reduce((sum, enrollment) => {
    const created = new Date(`${enrollment.createdAt}T00:00:00`)
    const updated = new Date(`${enrollment.updatedAt}T00:00:00`)
    const diff = Math.max(1, Math.round((updated - created) / 86400000) + 1)

    return sum + diff
  }, 0)

  return Math.round((totalDays / completed.length) * 10) / 10
})

const manualValidationsRequired = computed(
  () => paymentsStore.registeredCount + enrollmentsStore.pendingPaymentCount + gradesStore.pendingCount,
)

const kpiCards = computed(() => [
  {
    label: t('totalStudents'),
    value: dashboardMetrics.value?.kpis?.total_students ?? filteredStudents.value.length,
    helper: '',
    icon: Users,
    tone: 'blue',
  },
  {
    label: t('activeEnrollments'),
    value: dashboardMetrics.value?.kpis?.active_enrollments ?? enrollmentsStore.enrolledCount,
    helper: 'Enrolled',
    icon: ClipboardCheck,
    tone: 'green',
  },
  {
    label: t('pendingPayments'),
    value: dashboardMetrics.value?.kpis?.pending_payments ?? enrollmentsStore.pendingPaymentCount,
    helper: 'Pending Payment',
    icon: ReceiptText,
    tone: 'amber',
  },
  {
    label: t('availableCourses'),
    value: dashboardMetrics.value?.kpis?.courses_with_available_seats ?? coursesWithAvailableSeats.value,
    helper: `${coursesStore.availableSeats} ${t('seats').toLowerCase()}`,
    icon: BookOpenCheck,
    tone: 'violet',
  },
  {
    label: t('certificatesIssued'),
    value: dashboardMetrics.value?.kpis?.certificates_issued ?? certificatesStore.certificates.length,
    helper: 'Generated',
    icon: FileCheck2,
    tone: 'blue',
  },
  {
    label: t('academicIssues'),
    value:
      dashboardMetrics.value?.kpis?.failed_or_pending_processes ??
      failedOrPendingAcademicProcesses.value,
    helper: 'Pending + failed',
    icon: AlertTriangle,
    tone: 'red',
  },
])

const researchCards = computed(() => [
  {
    label: t('completionTime'),
    value:
      dashboardMetrics.value?.research_metrics?.average_enrollment_completion_time ??
      `${averageEnrollmentCompletionTime.value} ${t('days')}`,
    icon: Clock3,
  },
  {
    label: t('manualValidations'),
    value: dashboardMetrics.value?.research_metrics?.manual_validations_required ?? manualValidationsRequired.value,
    icon: ShieldAlert,
  },
  {
    label: t('duplicates'),
    value:
      dashboardMetrics.value?.research_metrics?.duplicate_student_records_detected ??
      duplicateRecords.value,
    icon: BadgeCheck,
  },
  {
    label: t('certificateTime'),
    value:
      dashboardMetrics.value?.research_metrics?.certificate_generation_time ??
      `0 ${t('minutes')}`,
    icon: Gauge,
  },
])

const enrollmentTrend = computed(() => {
  const remoteRows = dashboardMetrics.value?.charts?.enrollments_by_period

  if (!remoteRows?.length) return []

  const maxValue = Math.max(...remoteRows.map((item) => Number(item.value || 0)), 1)

  return remoteRows.map((item) => {
    const value = Number(item.value || 0)
    return {
      period: item.period,
      value,
      height: Math.max(10, Math.round((value / maxValue) * 100)),
    }
  })
})

const issuesByProgram = computed(() => {
  const remoteRows = dashboardMetrics.value?.charts?.pending_processes_by_program

  if (remoteRows?.length) {
    return remoteRows.map((row) => ({
      label: row.program || row.label || row.career,
      value: Number(row.value || row.pending || 0),
    }))
  }

  const rows = studentsStore.programs.map((program) => {
    const pendingEnrollments = enrollmentsStore.enrollments.filter(
      (enrollment) => enrollment.program === program && enrollment.status === 'Pending Payment',
    ).length
    const failedGrades = gradesStore.gradeRecords.filter((record) => {
      const course = coursesStore.courses.find((item) => item.id === record.courseId)

      return course?.program === program && record.status === 'Failed'
    }).length

    return {
      label: program,
      value: pendingEnrollments + failedGrades,
    }
  })
  return rows.filter((row) => row.value > 0)
})

const lineChart = computed(() => {
  const width = 680
  const height = 250
  const paddingX = 48
  const paddingY = 34
  const max = Math.max(...issuesByProgram.value.map((item) => item.value), 1)
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingY * 2
  const points = issuesByProgram.value.map((item, index) => {
    const x =
      paddingX +
      (issuesByProgram.value.length === 1
        ? plotWidth / 2
        : (index / (issuesByProgram.value.length - 1)) * plotWidth)
    const y = paddingY + plotHeight - (item.value / max) * plotHeight

    return {
      ...item,
      shortLabel:
        item.label.length > 16
          ? item.label
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 8)
          : item.label,
      x: Math.round(x),
      y: Math.round(y),
    }
  })

  return {
    width,
    height,
    points,
    polyline: points.map((point) => `${point.x},${point.y}`).join(' '),
    grid: [0, 1, 2, 3].map((step) => Math.round(paddingY + (step / 3) * plotHeight)),
  }
})

const indicatorsByProgram = computed(() => {
  const remoteRows = dashboardMetrics.value?.tables?.program_indicators

  if (remoteRows?.length) {
    return remoteRows.map((row) => ({
      program: row.program || row.career || row.name,
      students: row.students ?? row.total_students ?? 0,
      active: row.active ?? row.active_enrollments ?? 0,
      pending: row.pending ?? row.pending_payments ?? 0,
      seats: row.seats ?? row.available_seats ?? 0,
    }))
  }

  return studentsStore.programs.map((program) => {
    const students = filteredStudents.value.filter((student) => student.program === program)
    const enrollments = enrollmentsStore.enrollments.filter(
      (enrollment) => enrollment.program === program,
    )
    const courses = coursesStore.courses.filter((course) => course.program === program)
    const seats = courses.reduce(
      (total, course) => total + Math.max(0, course.capacity - course.studentIds.length),
      0,
    )

    return {
      program,
      students: students.length,
      active: enrollments.filter((enrollment) => enrollment.status === 'Enrolled').length,
      pending: enrollments.filter((enrollment) => enrollment.status === 'Pending Payment').length,
      seats,
    }
  })
})

const processRows = computed(() => {
  const remoteRows = dashboardMetrics.value?.tables?.operational_processes

  if (remoteRows?.length) {
    return remoteRows.map((row) => ({
      module: row.module,
      pending: row.pending ?? 0,
      completed: row.completed ?? 0,
    }))
  }

  return [
    {
      module: 'Enrollment',
      pending: enrollmentsStore.pendingPaymentCount + enrollmentsStore.draftCount,
      completed: enrollmentsStore.enrolledCount,
    },
    {
      module: 'Payments',
      pending: paymentsStore.registeredCount,
      completed: paymentsStore.validatedCount,
    },
    {
      module: 'Grades',
      pending: gradesStore.pendingCount + gradesStore.failedCount,
      completed: gradesStore.completedCount + gradesStore.passedCount,
    },
    {
      module: 'Certificates',
      pending: 0,
      completed: certificatesStore.certificates.length,
    },
  ]
})

const recentCertificates = computed(
  () => dashboardMetrics.value?.tables?.recent_certificates ?? certificatesStore.certificates.slice(0, 5),
)

function t(key) {
  return copy[ui.language][key]
}

function studentName(studentId) {
  const student = studentsStore.students.find((item) => item.id === studentId)

  return student ? `${student.firstName} ${student.lastName}` : studentId
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

async function fetchDashboardMetrics() {
  try {
    const response = await api.get('/dashboard/metrics', {
      params: {
        faculty_id: selectedFacultyId.value,
        career_id: selectedProgramId.value,
      },
    })

    dashboardMetrics.value = unwrapData(response)
  } catch {
    dashboardMetrics.value = null
  }
}

onMounted(fetchDashboardMetrics)
</script>

<template>
  <section class="dashboard-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="filters-card">
      <label>
        {{ t('faculty') }}
        <span class="control-shell">
          <select v-model="filters.faculty">
            <option value="">{{ t('allFaculties') }}</option>
            <option v-for="faculty in studentsStore.faculties" :key="faculty" :value="faculty">
              {{ faculty }}
            </option>
          </select>
          <ChevronDown :size="18" />
        </span>
      </label>
      <label>
        {{ t('program') }}
        <span class="control-shell">
          <select v-model="filters.program">
            <option value="">{{ t('allPrograms') }}</option>
            <option v-for="program in studentsStore.programs" :key="program" :value="program">
              {{ program }}
            </option>
          </select>
          <ChevronDown :size="18" />
        </span>
      </label>
      <label>
        {{ t('academicYear') }}
        <span class="control-shell">
          <input v-model="filters.academicYear" />
          <Calendar :size="18" />
        </span>
      </label>
      <button type="button" class="primary-action" @click="fetchDashboardMetrics">
        <Filter :size="20" />
        {{ t('filter') }}
      </button>
    </section>

    <section class="kpi-grid">
      <article
        v-for="card in kpiCards"
        :key="card.label"
        class="kpi-card"
        :class="`tone-${card.tone}`"
      >
        <span class="metric-icon">
          <component :is="card.icon" :size="28" />
        </span>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
          <small>{{ card.helper }}</small>
        </div>
      </article>
    </section>

    <div class="charts-grid">
      <section class="panel chart-panel">
        <div class="section-title">
          <h2>{{ t('enrollmentTrend') }}</h2>
        </div>
        <div class="bar-chart">
          <div class="axis">
            <span>500</span>
            <span>400</span>
            <span>300</span>
            <span>200</span>
            <span>100</span>
            <span>0</span>
          </div>
          <div class="bar-plot">
            <div v-for="item in enrollmentTrend" :key="item.period" class="bar-item">
              <strong>{{ item.value }}</strong>
              <span class="bar-track">
                <i :style="{ height: `${item.height}%` }"></i>
              </span>
              <small>{{ item.period }}</small>
            </div>
          </div>
        </div>
      </section>

      <section class="panel chart-panel">
        <div class="section-title">
          <h2>{{ t('issuesByProgram') }}</h2>
        </div>
        <div class="line-chart">
          <svg :viewBox="`0 0 ${lineChart.width} ${lineChart.height}`" role="img">
            <line
              v-for="line in lineChart.grid"
              :key="line"
              x1="34"
              :y1="line"
              :x2="lineChart.width - 28"
              :y2="line"
              class="grid-line"
            />
            <polyline :points="lineChart.polyline" class="chart-line" />
            <g v-for="point in lineChart.points" :key="point.label">
              <circle :cx="point.x" :cy="point.y" r="5" class="chart-dot" />
              <text :x="point.x" :y="point.y - 12" text-anchor="middle" class="point-value">
                {{ point.value }}
              </text>
              <text :x="point.x" y="230" text-anchor="middle" class="point-label">
                {{ point.shortLabel }}
              </text>
            </g>
          </svg>
        </div>
      </section>
    </div>

    <section class="panel research-panel">
      <div class="section-title">
        <h2>{{ t('researchMetrics') }}</h2>
        <Gauge :size="20" />
      </div>
      <div class="research-grid">
        <article v-for="card in researchCards" :key="card.label">
          <component :is="card.icon" :size="22" />
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </div>
    </section>

    <div class="tables-grid">
      <section class="panel">
        <div class="section-title">
          <h2>{{ t('indicatorsByProgram') }}</h2>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ t('program') }}</th>
                <th>{{ t('totalStudents') }}</th>
                <th>{{ t('active') }}</th>
                <th>{{ t('pending') }}</th>
                <th>{{ t('seats') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in indicatorsByProgram" :key="row.program">
                <td>{{ row.program }}</td>
                <td>{{ row.students }}</td>
                <td>{{ row.active }}</td>
                <td>{{ row.pending }}</td>
                <td>{{ row.seats }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <h2>{{ t('operationalProcesses') }}</h2>
        </div>
        <div class="table-scroll compact">
          <table>
            <thead>
              <tr>
                <th>{{ t('module') }}</th>
                <th>{{ t('pending') }}</th>
                <th>{{ t('completed') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in processRows" :key="row.module">
                <td>{{ row.module }}</td>
                <td>
                  <mark class="pill warning">{{ row.pending }}</mark>
                </td>
                <td>
                  <mark class="pill success">{{ row.completed }}</mark>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="section-title">
          <h2>{{ t('recentCertificates') }}</h2>
        </div>
        <div v-if="recentCertificates.length" class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ t('issuedTo') }}</th>
                <th>{{ t('type') }}</th>
                <th>{{ t('date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="certificate in recentCertificates" :key="certificate.id">
                <td>{{ certificate.id }}</td>
                <td>{{ studentName(certificate.studentId) }}</td>
                <td>{{ certificate.type }}</td>
                <td>{{ formatDate(certificate.generatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-state">{{ t('noCertificates') }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
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
.empty-state {
  margin: 0;
  color: var(--muted);
}

.filters-card,
.kpi-card,
.panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.filters-card {
  display: grid;
  grid-template-columns: repeat(3, minmax(190px, 1fr)) auto;
  gap: 16px;
  align-items: end;
  padding: 18px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

.control-shell {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--muted);
  background: color-mix(in srgb, var(--panel) 96%, var(--primary-soft));
}

select,
input {
  width: 100%;
  min-width: 0;
  border: 0;
  color: var(--text);
  background: transparent;
  font-weight: 650;
  outline: 0;
}

select {
  appearance: none;
}

.primary-action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  padding: 0 22px;
  color: #ffffff;
  background: var(--primary);
  font-weight: 850;
  box-shadow: 0 12px 22px color-mix(in srgb, var(--primary) 24%, transparent);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}

.kpi-card {
  min-height: 132px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
}

.metric-icon {
  display: grid;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
}

.metric-icon svg {
  display: block;
  width: 28px;
  height: 28px;
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

.tone-violet .metric-icon {
  background: #7c7cff;
}

.tone-red .metric-icon {
  background: #ff5757;
}

.kpi-card div > span,
.kpi-card small {
  display: block;
  color: var(--muted);
}

.kpi-card strong {
  display: block;
  margin: 6px 0;
  color: var(--text);
  font-size: 1.75rem;
}

.charts-grid,
.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.tables-grid {
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.75fr);
}

.tables-grid .panel:last-child {
  grid-column: 1 / -1;
}

.panel {
  min-width: 0;
  padding: 18px;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title h2 {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.bar-chart {
  min-height: 268px;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}

.axis {
  display: grid;
  align-content: space-between;
  height: 228px;
  padding: 8px 0 30px;
  color: var(--muted);
  font-size: 0.78rem;
}

.bar-plot {
  display: grid;
  grid-template-columns: repeat(6, 76px);
  justify-content: space-around;
  gap: 22px;
  align-items: end;
  min-width: 560px;
  height: 228px;
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(var(--line) 1px, transparent 1px) 0 7px / 100% 38px,
    transparent;
  padding: 8px 14px 0;
}

.bar-item {
  display: grid;
  grid-template-rows: 20px 156px 22px;
  justify-items: center;
  align-items: end;
  gap: 8px;
  color: var(--text);
}

.bar-item strong {
  align-self: start;
  font-size: 0.92rem;
}

.bar-track {
  position: relative;
  width: 42px;
  height: 156px;
  border-radius: 8px 8px 0 0;
  background: var(--panel-soft);
}

.bar-track i {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(180deg, #3b82f6, #0969ee);
}

.bar-item small {
  color: var(--muted);
}

.line-chart {
  min-height: 268px;
  overflow-x: auto;
  overflow-y: hidden;
}

.line-chart svg {
  display: block;
  min-width: 660px;
  width: 100%;
  height: 250px;
}

.grid-line {
  stroke: var(--line);
  stroke-width: 1;
}

.chart-line {
  fill: none;
  stroke: #0ea5b7;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.75;
}

.chart-dot {
  fill: #0ea5b7;
  stroke: var(--panel);
  stroke-width: 3;
}

.point-value {
  fill: var(--text);
  font-size: 13px;
  font-weight: 850;
}

.point-label {
  fill: var(--muted);
  font-size: 11px;
}

.research-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.research-grid article {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 4px 12px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
}

.research-grid svg {
  grid-row: span 2;
  color: var(--primary);
}

.research-grid span {
  color: var(--muted);
}

.research-grid strong {
  color: var(--text);
  font-size: 1.2rem;
}

table {
  min-width: 640px;
  width: 100%;
  border-collapse: collapse;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.table-scroll.compact table {
  min-width: 460px;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 12px 8px;
  color: var(--text);
  text-align: left;
  vertical-align: middle;
}

th {
  color: var(--muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

tbody tr {
  transition: background 0.2s ease;
}

tbody tr:hover {
  background: color-mix(in srgb, var(--primary-soft) 55%, transparent);
}

.pill {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  border-radius: 6px;
  padding: 0 9px;
  font-size: 0.78rem;
  font-weight: 850;
}

.pill.warning {
  color: #d87500;
  background: #fff1d8;
}

.pill.success {
  color: #087c35;
  background: #dff4e8;
}

@media (max-width: 1180px) {
  .filters-card,
  .charts-grid,
  .tables-grid {
    grid-template-columns: 1fr;
  }

  .tables-grid .panel:last-child {
    grid-column: auto;
  }
}

@media (max-width: 760px) {
  .dashboard-page {
    padding: 20px;
  }

  .bar-chart {
    grid-template-columns: 34px 1fr;
  }

  .axis {
    font-size: 0.72rem;
  }

  .panel {
    padding: 16px;
  }
}
</style>
