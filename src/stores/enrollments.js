import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizeEnrollment, normalizeSubject, toBackendEnrollment } from '@/services/normalizers'
import { useStudentsStore } from '@/stores/students'

const academicPeriods = []
const statusFlow = ['Draft', 'Pending Payment', 'Payment Confirmed', 'Enrolled', 'Cancelled']

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const enrollments = ref([])
  const programCatalog = ref([])
  const selectedEnrollmentId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedEnrollment = computed(
    () => enrollments.value.find((enrollment) => enrollment.id === selectedEnrollmentId.value) ?? enrollments.value[0],
  )
  const programs = computed(() => programCatalog.value.map((program) => program.name))
  const pendingPaymentCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Pending Payment').length,
  )
  const enrolledCount = computed(() => enrollments.value.filter((enrollment) => enrollment.status === 'Enrolled').length)
  const draftCount = computed(() => enrollments.value.filter((enrollment) => enrollment.status === 'Draft').length)
  const cancelledCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Cancelled').length,
  )

  function getProgram(name) {
    return programCatalog.value.find((program) => program.name === name) ?? programCatalog.value[0]
  }

  function getSubjectsByProgram(programName) {
    return getProgram(programName)?.subjects ?? []
  }

  async function fetchCatalogs() {
    try {
      const [periodsResponse, careersResponse, subjectsResponse] = await Promise.allSettled([
        api.get('/academic-periods'),
        api.get('/careers'),
        api.get('/subjects'),
      ])

      if (periodsResponse.status === 'fulfilled') {
        academicPeriods.splice(0, academicPeriods.length, ...unwrapData(periodsResponse.value).map((item) => item.name))
      }

      if (careersResponse.status === 'fulfilled') {
        const subjects =
          subjectsResponse.status === 'fulfilled' ? unwrapData(subjectsResponse.value).map(normalizeSubject) : []

        programCatalog.value = unwrapData(careersResponse.value).map((career) => ({
          id: career.id,
          name: career.name,
          faculty: career.faculty?.name || '',
          subjects: subjects.filter((subject) => !subject.raw?.career_id || subject.raw.career_id === career.id),
        }))
      }
    } catch {
      return { ok: false }
    }

    return { ok: true }
  }

  async function fetchEnrollments(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/enrollments', { params })
      const rows = unwrapData(response).map(normalizeEnrollment)

      enrollments.value = rows
      selectedEnrollmentId.value = rows[0]?.id ?? null

      return { ok: true, enrollments: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar las matriculas.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function createEnrollment(payload) {
    const studentsStore = useStudentsStore()

    try {
      const student = studentsStore.students.find((item) => item.id === payload.studentId)
      const program = getProgram(payload.program)
      const response = await api.post(
        '/enrollments',
        toBackendEnrollment({
          ...payload,
          studentApiId: student?.apiId,
          programId: program?.id,
        }),
      )
      const enrollment = normalizeEnrollment(unwrapData(response))

      enrollments.value.unshift(enrollment)
      selectedEnrollmentId.value = enrollment.id
      studentsStore.applyEnrollment(payload.studentId, enrollment)

      return { ok: true, enrollment }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo crear la matricula.') }
    }
  }

  async function updateStatus(enrollmentId, endpoint, fallbackStatus) {
    const studentsStore = useStudentsStore()
    const index = enrollments.value.findIndex((enrollment) => enrollment.id === enrollmentId)

    if (index === -1) return { ok: false, message: 'Enrollment was not found.' }

    try {
      const apiId = enrollments.value[index].apiId || enrollmentId
      const response = await api.post(`/enrollments/${apiId}/${endpoint}`)
      const enrollment = normalizeEnrollment(unwrapData(response))

      enrollments.value[index] = enrollment
      studentsStore.applyEnrollment(enrollment.studentId, enrollment)

      return { ok: true, enrollment }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, `No se pudo cambiar la matricula a ${fallbackStatus}.`) }
    }
  }

  function confirmPayment(enrollmentId) {
    return updateStatus(enrollmentId, 'confirm-payment', 'Payment Confirmed')
  }

  function markEnrolled(enrollmentId) {
    return updateStatus(enrollmentId, 'activate', 'Enrolled')
  }

  function cancelEnrollment(enrollmentId) {
    return updateStatus(enrollmentId, 'cancel', 'Cancelled')
  }

  function validatePayment(enrollmentId, paymentReference) {
    return updateStatus(enrollmentId, 'activate', 'Enrolled', paymentReference)
  }

  function selectEnrollment(enrollmentId) {
    selectedEnrollmentId.value = enrollmentId
  }

  return {
    academicPeriods,
    programCatalog,
    statusFlow,
    enrollments,
    selectedEnrollmentId,
    selectedEnrollment,
    programs,
    pendingPaymentCount,
    enrolledCount,
    draftCount,
    cancelledCount,
    loading,
    error,
    fetchCatalogs,
    fetchEnrollments,
    getProgram,
    getSubjectsByProgram,
    createEnrollment,
    confirmPayment,
    markEnrolled,
    cancelEnrollment,
    validatePayment,
    selectEnrollment,
  }
})
