import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizeStudent, toBackendStudent } from '@/services/normalizers'

const currentYear = new Date().getFullYear()

function buildStudentId(sequence) {
  return `STU-${currentYear}-${String(sequence).padStart(4, '0')}`
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

export const useStudentsStore = defineStore('students', () => {
  const students = ref([])
  const selectedStudentId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedStudent = computed(
    () => students.value.find((student) => student.id === selectedStudentId.value) ?? students.value[0],
  )
  const activeCount = computed(() => students.value.filter((student) => student.academicStatus === 'Active').length)
  const pendingEnrollmentCount = computed(
    () => students.value.filter((student) => student.enrollmentStatus === 'Pending Payment').length,
  )
  const atRiskCount = computed(() => students.value.filter((student) => student.academicStatus === 'At Risk').length)
  const duplicateValidatedCount = computed(
    () => students.value.filter((student) => student.duplicateValidated).length,
  )
  const faculties = computed(() => [...new Set(students.value.map((student) => student.faculty).filter(Boolean))])
  const programs = computed(() => [...new Set(students.value.map((student) => student.program).filter(Boolean))])
  const academicStatuses = computed(() => [...new Set(students.value.map((student) => student.academicStatus))])
  const enrollmentStatuses = computed(() => [...new Set(students.value.map((student) => student.enrollmentStatus))])
  const nextStudentId = computed(() => buildStudentId(students.value.length + 1))

  function findDuplicate(candidate, ignoredId = null) {
    const documentId = normalize(candidate.documentId)
    const email = normalize(candidate.email)

    return students.value.find((student) => {
      if (student.id === ignoredId) return false

      return normalize(student.documentId) === documentId || normalize(student.email) === email
    })
  }

  async function checkDuplicate(candidate, ignoredId = null) {
    try {
      const response = await api.get('/students/check-duplicate', {
        params: {
          document_number: candidate.documentId || undefined,
          email: candidate.email || undefined,
          ignore_student_id: ignoredId || undefined,
        },
      })

      return response.data
    } catch {
      const duplicate = findDuplicate(candidate, ignoredId)

      return { duplicate: Boolean(duplicate), matches: duplicate ? [duplicate] : [] }
    }
  }

  async function fetchStudents(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/students', { params })
      const rows = unwrapData(response).map(normalizeStudent)

      students.value = rows
      selectedStudentId.value = rows[0]?.id ?? null

      return { ok: true, students: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar los estudiantes.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function createStudent(payload) {
    const duplicate = await checkDuplicate(payload)

    if (duplicate.duplicate) {
      const match = duplicate.matches?.[0]

      return {
        ok: false,
        message: `Posible duplicado detectado: ${match?.student_code || match?.id || 'otro estudiante'} ya usa ese documento o correo.`,
      }
    }

    try {
      const response = await api.post('/students', toBackendStudent({ ...payload, id: nextStudentId.value }))
      const student = normalizeStudent(unwrapData(response))

      students.value.unshift(student)
      selectedStudentId.value = student.id

      return { ok: true, student }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo crear el estudiante.') }
    }
  }

  async function updateStudent(studentId, payload) {
    const index = students.value.findIndex((student) => student.id === studentId)

    if (index === -1) return { ok: false, message: 'No se encontro el estudiante.' }

    const duplicate = await checkDuplicate(payload, students.value[index].apiId)

    if (duplicate.duplicate) {
      const match = duplicate.matches?.[0]

      return {
        ok: false,
        message: `Posible duplicado detectado: ${match?.student_code || match?.id || 'otro estudiante'} ya usa ese documento o correo.`,
      }
    }

    try {
      const apiId = students.value[index].apiId || studentId
      const response = await api.put(`/students/${apiId}`, toBackendStudent(payload))
      const student = normalizeStudent(unwrapData(response))

      students.value[index] = student

      return { ok: true, student }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo actualizar el estudiante.') }
    }
  }

  function applyEnrollment(studentId, enrollment) {
    const index = students.value.findIndex(
      (student) => student.id === studentId || student.apiId === studentId || student.apiId === enrollment.studentApiId,
    )

    if (index === -1) return { ok: false, message: 'No se encontro el estudiante.' }

    const today = new Date().toISOString().slice(0, 10)

    students.value[index] = {
      ...students.value[index],
      program: enrollment.program || students.value[index].program,
      faculty: enrollment.faculty || students.value[index].faculty,
      enrollmentStatus: enrollment.status,
      admissionTerm: enrollment.academicPeriod,
      lastUpdated: today,
      enrollments: [
        {
          id: enrollment.id,
          academicPeriod: enrollment.academicPeriod,
          program: enrollment.program,
          status: enrollment.status,
          subjects: enrollment.subjects,
          totalCredits: enrollment.totalCredits,
          updatedAt: today,
        },
        ...(students.value[index].enrollments ?? []),
      ],
      history: [
        {
          date: today,
          title: 'Matricula registrada',
          detail: `${enrollment.id} creada en estado ${enrollment.status}.`,
        },
        ...(students.value[index].history ?? []),
      ],
    }

    selectedStudentId.value = students.value[index].id

    return { ok: true, student: students.value[index] }
  }

  function selectStudent(studentId) {
    selectedStudentId.value = studentId
  }

  return {
    students,
    selectedStudentId,
    selectedStudent,
    activeCount,
    pendingEnrollmentCount,
    atRiskCount,
    duplicateValidatedCount,
    faculties,
    programs,
    academicStatuses,
    enrollmentStatuses,
    nextStudentId,
    loading,
    error,
    fetchStudents,
    checkDuplicate,
    createStudent,
    updateStudent,
    applyEnrollment,
    selectStudent,
  }
})
