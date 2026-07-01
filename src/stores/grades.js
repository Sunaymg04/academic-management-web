import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizeGrade } from '@/services/normalizers'
import { useCoursesStore } from '@/stores/courses'
import { useStudentsStore } from '@/stores/students'

export const useGradesStore = defineStore('grades', () => {
  const gradeRecords = ref([])
  const selectedRecordId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedRecord = computed(
    () => gradeRecords.value.find((record) => record.id === selectedRecordId.value) ?? gradeRecords.value[0],
  )
  const pendingCount = computed(() => gradeRecords.value.filter((record) => record.status === 'Pending Grade').length)
  const passedCount = computed(() => gradeRecords.value.filter((record) => record.status === 'Passed').length)
  const failedCount = computed(() => gradeRecords.value.filter((record) => record.status === 'Failed').length)
  const completedCount = computed(() => gradeRecords.value.filter((record) => record.status === 'Completed').length)
  const gradeAverage = computed(() => {
    const numericGrades = gradeRecords.value.map((record) => record.score).filter((score) => score !== null && score !== '')

    if (!numericGrades.length) return 0

    return Math.round((numericGrades.reduce((total, score) => total + Number(score), 0) / numericGrades.length) * 10) / 10
  })
  const gradableStudents = computed(() => {
    const coursesStore = useCoursesStore()
    const studentsStore = useStudentsStore()
    const rows = []

    coursesStore.courses.forEach((course) => {
      course.studentIds.forEach((studentId) => {
        const student = studentsStore.students.find((item) => item.id === studentId || item.apiId === studentId)

        if (student) {
          rows.push({
            studentId: student.id,
            courseId: course.id,
            subjectEnrollmentId: course.subjectEnrollmentByStudent?.[student.id] || course.subjectEnrollmentByStudent?.[student.apiId],
            label: `${student.id} - ${student.firstName} ${student.lastName} - ${course.subjectCode}`,
          })
        }
      })
    })

    return rows
  })

  async function fetchGrades(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/grades', { params })
      const rows = unwrapData(response).map(normalizeGrade)

      gradeRecords.value = rows
      selectedRecordId.value = rows[0]?.id ?? null

      return { ok: true, gradeRecords: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar las notas.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function upsertGrade(payload) {
    const existing = gradeRecords.value.find(
      (record) => record.courseId === payload.courseId && record.studentId === payload.studentId,
    )
    const studentsStore = useStudentsStore()
    const coursesStore = useCoursesStore()
    const student = studentsStore.students.find((item) => item.id === payload.studentId)
    const course = coursesStore.courses.find((item) => item.id === payload.courseId)

    const subjectEnrollmentId =
      payload.subjectEnrollmentId ||
      course?.subjectEnrollmentByStudent?.[payload.studentId] ||
      course?.subjectEnrollmentByStudent?.[student?.apiId]

    if (!course) return { ok: false, message: 'Course group was not found.' }
    if (!subjectEnrollmentId) return { ok: false, message: 'Primero matricula al estudiante en la asignatura.' }
    if (existing && !payload.reason?.trim()) {
      return { ok: false, message: 'A change reason is required to preserve academic traceability.' }
    }

    try {
      const body = {
        student_id: student?.apiId || payload.studentId,
        subject_enrollment_id: subjectEnrollmentId,
        subject_offering_id: course.apiId || payload.courseId,
        subject_id: course.raw?.subject_id || null,
        raw_value: payload.score === '' ? null : Number(payload.score),
        status: payload.status || 'published',
        change_reason: payload.reason,
        evaluated_at: new Date().toISOString().slice(0, 10),
        is_final: true,
      }
      const response = existing?.apiId
        ? await api.put(`/grades/${existing.apiId}`, body)
        : await api.post('/grades', body)
      const record = normalizeGrade(unwrapData(response))

      if (existing) {
        const index = gradeRecords.value.findIndex((item) => item.id === existing.id)

        gradeRecords.value[index] = record
      } else {
        gradeRecords.value.unshift(record)
      }

      selectedRecordId.value = record.id

      return { ok: true, record }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo guardar la nota.') }
    }
  }

  async function completeRecord(recordId, reason) {
    const index = gradeRecords.value.findIndex((record) => record.id === recordId)

    if (index === -1) return { ok: false, message: 'Grade record was not found.' }
    if (!reason?.trim()) return { ok: false, message: 'A completion reason is required to preserve academic traceability.' }

    return upsertGrade({
      studentId: gradeRecords.value[index].studentId,
      courseId: gradeRecords.value[index].courseId,
      subjectEnrollmentId: gradeRecords.value[index].subjectEnrollmentId,
      score: gradeRecords.value[index].score,
      status: 'published',
      reason,
    })
  }

  function transcriptForStudent(studentId) {
    const records = gradeRecords.value.filter((record) => record.studentId === studentId)
    const numericGrades = records.map((record) => record.score).filter((score) => score !== null && score !== '')
    const average = numericGrades.length
      ? Math.round((numericGrades.reduce((total, score) => total + Number(score), 0) / numericGrades.length) * 10) / 10
      : 0

    return { records, average }
  }

  async function fetchTranscriptForStudent(studentId) {
    try {
      const response = await api.get(`/students/${studentId}/transcript`)
      const records = unwrapData(response).records?.map(normalizeGrade) ?? unwrapData(response).map?.(normalizeGrade) ?? []

      return { ok: true, records }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError), ...transcriptForStudent(studentId) }
    }
  }

  function selectRecord(recordId) {
    selectedRecordId.value = recordId
  }

  return {
    gradeRecords,
    selectedRecordId,
    selectedRecord,
    pendingCount,
    passedCount,
    failedCount,
    completedCount,
    gradeAverage,
    gradableStudents,
    loading,
    error,
    fetchGrades,
    fetchTranscriptForStudent,
    upsertGrade,
    completeRecord,
    transcriptForStudent,
    selectRecord,
  }
})
