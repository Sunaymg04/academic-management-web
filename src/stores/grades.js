import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useCoursesStore } from '@/stores/courses'
import { useStudentsStore } from '@/stores/students'

function buildGradeId(sequence) {
  return `GRD-2026-${String(sequence).padStart(4, '0')}`
}

function resolveStatus(score, completed = false) {
  if (completed) return 'Completed'
  if (score === '' || score === null || Number.isNaN(Number(score))) return 'Pending Grade'

  return Number(score) >= 60 ? 'Passed' : 'Failed'
}

export const useGradesStore = defineStore('grades', () => {
  const gradeRecords = ref([])
  const selectedRecordId = ref(null)

  const selectedRecord = computed(
    () => gradeRecords.value.find((record) => record.id === selectedRecordId.value) ?? gradeRecords.value[0],
  )

  const pendingCount = computed(
    () => gradeRecords.value.filter((record) => record.status === 'Pending Grade').length,
  )
  const passedCount = computed(
    () => gradeRecords.value.filter((record) => record.status === 'Passed').length,
  )
  const failedCount = computed(
    () => gradeRecords.value.filter((record) => record.status === 'Failed').length,
  )
  const completedCount = computed(
    () => gradeRecords.value.filter((record) => record.status === 'Completed').length,
  )

  const gradeAverage = computed(() => {
    const numericGrades = gradeRecords.value
      .map((record) => record.score)
      .filter((score) => score !== null && score !== '')

    if (!numericGrades.length) return 0

    return Math.round((numericGrades.reduce((total, score) => total + Number(score), 0) / numericGrades.length) * 10) / 10
  })

  const gradableStudents = computed(() => {
    const coursesStore = useCoursesStore()
    const studentsStore = useStudentsStore()
    const rows = []

    coursesStore.courses.forEach((course) => {
      course.studentIds.forEach((studentId) => {
        const student = studentsStore.students.find((item) => item.id === studentId)

        if (student) {
          rows.push({
            studentId,
            courseId: course.id,
            label: `${student.id} · ${student.firstName} ${student.lastName} · ${course.subjectCode}`,
          })
        }
      })
    })

    return rows
  })

  function findExistingRecord(courseId, studentId) {
    return gradeRecords.value.find(
      (record) => record.courseId === courseId && record.studentId === studentId,
    )
  }

  function upsertGrade(payload) {
    const coursesStore = useCoursesStore()
    const course = coursesStore.courses.find((item) => item.id === payload.courseId)

    if (!course) return { ok: false, message: 'Course group was not found.' }
    if (!course.studentIds.includes(payload.studentId)) {
      return { ok: false, message: 'Student is not assigned to this course group.' }
    }

    const today = new Date().toISOString().slice(0, 10)
    const existing = findExistingRecord(payload.courseId, payload.studentId)
    const score = payload.score === '' ? null : Number(payload.score)
    const status = resolveStatus(score)

    if (existing) {
      if (!payload.reason?.trim()) {
        return { ok: false, message: 'A change reason is required to preserve academic traceability.' }
      }

      const index = gradeRecords.value.findIndex((record) => record.id === existing.id)

      gradeRecords.value[index] = {
        ...gradeRecords.value[index],
        score,
        status,
        updatedAt: today,
        history: [
          {
            date: today,
            title: 'Grade changed',
            detail: `Score changed from ${existing.score ?? 'Pending'} to ${score ?? 'Pending'}. Reason: ${payload.reason}.`,
          },
          ...gradeRecords.value[index].history,
        ],
      }

      selectedRecordId.value = existing.id

      return { ok: true, record: gradeRecords.value[index] }
    }

    const record = {
      id: buildGradeId(gradeRecords.value.length + 1),
      studentId: payload.studentId,
      courseId: payload.courseId,
      subjectCode: course.subjectCode,
      subjectName: course.subjectName,
      group: course.group,
      teacher: course.teacher,
      score,
      status,
      createdAt: today,
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Grade registered',
          detail: `Initial score set to ${score ?? 'Pending Grade'}.`,
        },
      ],
    }

    gradeRecords.value.unshift(record)
    selectedRecordId.value = record.id

    return { ok: true, record }
  }

  function completeRecord(recordId, reason) {
    const index = gradeRecords.value.findIndex((record) => record.id === recordId)

    if (index === -1) return { ok: false, message: 'Grade record was not found.' }
    if (!reason?.trim()) {
      return { ok: false, message: 'A completion reason is required to preserve academic traceability.' }
    }

    const today = new Date().toISOString().slice(0, 10)

    gradeRecords.value[index] = {
      ...gradeRecords.value[index],
      status: 'Completed',
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Academic record completed',
          detail: reason,
        },
        ...gradeRecords.value[index].history,
      ],
    }

    selectedRecordId.value = recordId

    return { ok: true, record: gradeRecords.value[index] }
  }

  function transcriptForStudent(studentId) {
    const records = gradeRecords.value.filter((record) => record.studentId === studentId)
    const numericGrades = records
      .map((record) => record.score)
      .filter((score) => score !== null && score !== '')
    const average = numericGrades.length
      ? Math.round((numericGrades.reduce((total, score) => total + Number(score), 0) / numericGrades.length) * 10) / 10
      : 0

    return { records, average }
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
    upsertGrade,
    completeRecord,
    transcriptForStudent,
    selectRecord,
  }
})
