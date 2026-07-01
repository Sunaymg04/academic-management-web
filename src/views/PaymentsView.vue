<script setup>
import { computed, reactive, ref } from 'vue'
import {
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
} from '@lucide/vue'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { usePaymentsStore } from '@/stores/payments'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const enrollmentsStore = useEnrollmentsStore()
const paymentsStore = usePaymentsStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Validación Financiera',
    subtitle: 'Registro manual y simulación de pagos conectados con matrícula',
    enrollment: 'Matrícula',
    amount: 'Importe',
    method: 'Método',
    reference: 'Referencia',
    notes: 'Notas',
    register: 'Registrar pago',
    validate: 'Validar pago',
    reject: 'Rechazar',
    search: 'Buscar pago, matrícula o estudiante',
    status: 'Estado',
    allStatuses: 'Todos los estados',
    registered: 'Registrados',
    validated: 'Validados',
    rejected: 'Rechazados',
    validatedAmount: 'Importe validado',
    payments: 'Pagos',
    student: 'Estudiante',
    paymentDetail: 'Detalle del pago',
    courseLists: 'Listas de curso activas',
    noPayments: 'No hay pagos para los filtros seleccionados.',
    noEnrollments: 'Crea una matrícula pendiente de pago para registrar un pago.',
    noCourses: 'Aún no hay estudiantes inscritos en asignaturas.',
    created: 'Pago registrado correctamente.',
    flow: 'Al validar el pago, la matrícula cambia automáticamente a Inscrito.',
    history: 'Historial',
    date: 'Fecha',
  },
  en: {
    title: 'Financial Validation',
    subtitle: 'Manual payment registration and simulated validation connected to enrollment',
    enrollment: 'Enrollment',
    amount: 'Amount',
    method: 'Method',
    reference: 'Reference',
    notes: 'Notes',
    register: 'Register payment',
    validate: 'Validate payment',
    reject: 'Reject',
    search: 'Search payment, enrollment, or student',
    status: 'Status',
    allStatuses: 'All statuses',
    registered: 'Registered',
    validated: 'Validated',
    rejected: 'Rejected',
    validatedAmount: 'Validated amount',
    payments: 'Payments',
    student: 'Student',
    paymentDetail: 'Payment detail',
    courseLists: 'Active course lists',
    noPayments: 'No payments match the selected filters.',
    noEnrollments: 'Create a pending payment enrollment before registering a payment.',
    noCourses: 'No students are enrolled in subjects yet.',
    created: 'Payment registered successfully.',
    flow: 'When payment is validated, enrollment automatically changes to Enrolled.',
    history: 'History',
    date: 'Date',
  },
}

const statusLabels = {
  es: {
    Registered: 'Registrado',
    Validated: 'Validado',
    Rejected: 'Rechazado',
    'Pending Payment': 'Pago pendiente',
    Enrolled: 'Inscrito',
  },
  en: {
    Registered: 'Registered',
    Validated: 'Validated',
    Rejected: 'Rejected',
    'Pending Payment': 'Pending Payment',
    Enrolled: 'Enrolled',
  },
}

const form = reactive({
  enrollmentId: '',
  amount: 450,
  method: paymentsStore.paymentMethods[0],
  reference: '',
  notes: '',
})
const filters = reactive({
  search: '',
  status: '',
})
const feedback = ref('')

const payableEnrollments = computed(() =>
  enrollmentsStore.enrollments.filter((enrollment) => enrollment.status === 'Pending Payment'),
)
const selectedPayment = computed(() => paymentsStore.selectedPayment)

const filteredPayments = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return paymentsStore.payments.filter((payment) => {
    const enrollment = findEnrollment(payment.enrollmentId)
    const student = enrollment ? findStudent(enrollment.studentId) : null
    const matchesStatus = !filters.status || payment.status === filters.status
    const matchesSearch =
      !query ||
      [
        payment.id,
        payment.reference,
        payment.enrollmentId,
        enrollment?.program,
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

const courseLists = computed(() => {
  const lists = new Map()

  enrollmentsStore.enrollments
    .filter((enrollment) => enrollment.status === 'Enrolled')
    .forEach((enrollment) => {
      const student = findStudent(enrollment.studentId)

      enrollment.subjects.forEach((subject) => {
        if (!lists.has(subject.code)) {
          lists.set(subject.code, {
            code: subject.code,
            name: subject.name,
            students: [],
          })
        }

        lists.get(subject.code).students.push({
          id: enrollment.studentId,
          name: student ? `${student.firstName} ${student.lastName}` : enrollment.studentId,
          enrollmentId: enrollment.id,
        })
      })
    })

  return [...lists.values()]
})

const metricCards = computed(() => [
  {
    label: t('payments'),
    value: paymentsStore.payments.length,
    icon: ReceiptText,
    tone: 'blue',
  },
  {
    label: t('registered'),
    value: paymentsStore.registeredCount,
    icon: Clock3,
    tone: 'amber',
  },
  {
    label: t('validated'),
    value: paymentsStore.validatedCount,
    icon: ShieldCheck,
    tone: 'green',
  },
  {
    label: t('rejected'),
    value: paymentsStore.rejectedCount,
    icon: Ban,
    tone: 'red',
  },
  {
    label: t('validatedAmount'),
    value: formatMoney(paymentsStore.validatedAmount),
    icon: WalletCards,
    tone: 'violet',
  },
])

function t(key) {
  return copy[ui.language][key]
}

function label(value) {
  return statusLabels[ui.language][value] ?? value
}

function findEnrollment(enrollmentId) {
  return enrollmentsStore.enrollments.find((enrollment) => enrollment.id === enrollmentId)
}

function findStudent(studentId) {
  return studentsStore.students.find((student) => student.id === studentId)
}

function enrollmentLabel(enrollmentId) {
  const enrollment = findEnrollment(enrollmentId)
  const student = enrollment ? findStudent(enrollment.studentId) : null

  if (!enrollment) return enrollmentId

  return `${enrollment.id} · ${student ? `${student.firstName} ${student.lastName}` : enrollment.studentId}`
}

function statusClass(value) {
  return String(value).toLowerCase().replaceAll(' ', '-')
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

function formatMoney(value) {
  return new Intl.NumberFormat(ui.language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function submitPayment() {
  if (!form.enrollmentId && payableEnrollments.value[0]) {
    form.enrollmentId = payableEnrollments.value[0].id
  }

  const result = paymentsStore.registerPayment({ ...form })

  feedback.value = result.ok ? t('created') : result.message
  form.reference = ''
  form.notes = ''
}

function selectPayment(paymentId) {
  paymentsStore.selectPayment(paymentId)
}
</script>

<template>
  <section class="payments-page">
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
          <span>{{ t('flow') }}</span>
        </div>
      </div>

      <form class="payment-form" @submit.prevent="submitPayment">
        <label>
          {{ t('enrollment') }}
          <select v-model="form.enrollmentId" required>
            <option value="" disabled>{{ t('noEnrollments') }}</option>
            <option
              v-for="enrollment in payableEnrollments"
              :key="enrollment.id"
              :value="enrollment.id"
            >
              {{ enrollmentLabel(enrollment.id) }} · {{ enrollment.program }}
            </option>
          </select>
        </label>

        <label>
          {{ t('amount') }}
          <input v-model.number="form.amount" min="1" type="number" required />
        </label>

        <label>
          {{ t('method') }}
          <select v-model="form.method" required>
            <option v-for="method in paymentsStore.paymentMethods" :key="method" :value="method">
              {{ method }}
            </option>
          </select>
        </label>

        <label>
          {{ t('reference') }}
          <input v-model.trim="form.reference" placeholder="Receipt or transfer number" />
        </label>

        <label class="wide">
          {{ t('notes') }}
          <input v-model.trim="form.notes" placeholder="Optional notes" />
        </label>

        <div class="form-footer">
          <p aria-live="polite">{{ feedback }}</p>
          <button type="submit" class="primary-action" :disabled="!payableEnrollments.length">
            <BadgeDollarSign :size="20" />
            {{ t('register') }}
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
              <option v-for="status in paymentsStore.paymentStatuses" :key="status" :value="status">
                {{ label(status) }}
              </option>
            </select>
          </label>
        </div>

        <div class="payment-table" role="table" aria-label="Payment records">
          <div class="payment-row table-head" role="row">
            <span>ID</span>
            <span>{{ t('enrollment') }}</span>
            <span>{{ t('amount') }}</span>
            <span>{{ t('method') }}</span>
            <span>{{ t('status') }}</span>
            <span>{{ t('date') }}</span>
          </div>

          <button
            v-for="payment in filteredPayments"
            :key="payment.id"
            type="button"
            class="payment-row"
            :class="{ selected: selectedPayment?.id === payment.id }"
            @click="selectPayment(payment.id)"
          >
            <span>{{ payment.id }}</span>
            <span>{{ enrollmentLabel(payment.enrollmentId) }}</span>
            <span>{{ formatMoney(payment.amount) }}</span>
            <span>{{ payment.method }}</span>
            <span>
              <mark class="pill" :class="statusClass(payment.status)">
                {{ label(payment.status) }}
              </mark>
            </span>
            <span>{{ formatDate(payment.registeredAt) }}</span>
          </button>

          <p v-if="!filteredPayments.length" class="empty-state">{{ t('noPayments') }}</p>
        </div>
      </section>

      <aside v-if="selectedPayment" class="detail-card">
        <div class="detail-header">
          <h2>{{ t('paymentDetail') }}</h2>
          <mark class="pill" :class="statusClass(selectedPayment.status)">
            {{ label(selectedPayment.status) }}
          </mark>
        </div>

        <dl class="detail-grid">
          <div>
            <dt>ID</dt>
            <dd>{{ selectedPayment.id }}</dd>
          </div>
          <div>
            <dt>{{ t('enrollment') }}</dt>
            <dd>{{ enrollmentLabel(selectedPayment.enrollmentId) }}</dd>
          </div>
          <div>
            <dt>{{ t('amount') }}</dt>
            <dd>{{ formatMoney(selectedPayment.amount) }}</dd>
          </div>
          <div>
            <dt>{{ t('reference') }}</dt>
            <dd>{{ selectedPayment.reference }}</dd>
          </div>
        </dl>

        <div class="action-grid">
          <button
            type="button"
            class="primary-action"
            :disabled="selectedPayment.status !== 'Registered'"
            @click="paymentsStore.validatePayment(selectedPayment.id)"
          >
            <CheckCircle2 :size="19" />
            {{ t('validate') }}
          </button>
          <button
            type="button"
            class="danger-action"
            :disabled="selectedPayment.status !== 'Registered'"
            @click="paymentsStore.rejectPayment(selectedPayment.id)"
          >
            <Ban :size="19" />
            {{ t('reject') }}
          </button>
        </div>

        <section class="history-list">
          <h3>
            <Clock3 :size="18" />
            {{ t('history') }}
          </h3>
          <ol>
            <li v-for="event in selectedPayment.history" :key="`${event.date}-${event.title}`">
              <time>{{ formatDate(event.date) }}</time>
              <strong>{{ event.title }}</strong>
              <span>{{ event.detail }}</span>
            </li>
          </ol>
        </section>
      </aside>
    </div>

    <section class="course-card">
      <div class="section-title">
        <div>
          <h2>
            <ClipboardList :size="20" />
            {{ t('courseLists') }}
          </h2>
        </div>
      </div>

      <div v-if="courseLists.length" class="course-grid">
        <article v-for="course in courseLists" :key="course.code" class="course-list">
          <strong>{{ course.code }} · {{ course.name }}</strong>
          <ul>
            <li v-for="student in course.students" :key="`${course.code}-${student.id}`">
              <span>{{ student.name }}</span>
              <small>{{ student.enrollmentId }}</small>
            </li>
          </ul>
        </article>
      </div>

      <p v-else class="empty-state">{{ t('noCourses') }}</p>
    </section>
  </section>
</template>

<style scoped>
.payments-page {
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
.course-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.form-card,
.list-card,
.detail-card,
.course-card {
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

.payment-form {
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
  grid-column: span 2;
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
  font-size: 1.55rem;
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

.payment-table {
  overflow-x: auto;
}

.payment-row {
  width: 100%;
  min-width: 850px;
  display: grid;
  grid-template-columns: 132px 1.5fr 110px 150px 120px 120px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.payment-row:not(.table-head):hover,
.payment-row.selected {
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

.pill.validated,
.pill.enrolled {
  color: #087c35;
  background: #dff4e8;
}

.pill.rejected {
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

.action-grid {
  display: grid;
  gap: 10px;
}

.history-list {
  margin-top: 16px;
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

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.course-list {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
  background: var(--panel-soft);
}

.course-list strong,
.course-list span,
.course-list small {
  display: block;
}

.course-list ul {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.course-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

.course-list small {
  color: var(--muted);
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .payment-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .payments-page {
    padding: 20px;
  }

  .payment-form,
  .filters-card,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .wide {
    grid-column: auto;
  }

  .form-footer,
  .section-title,
  .detail-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
