import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizeCourseGroup } from '@/services/normalizers'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useStudentsStore } from '@/stores/students'

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref([])
  const teachers = ref([])
  const selectedCourseId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedCourse = computed(() => courses.value.find((course) => course.id === selectedCourseId.value) ?? courses.value[0])
  const totalCapacity = computed(() => courses.value.reduce((total, course) => total + course.capacity, 0))
  const totalAssigned = computed(() => courses.value.reduce((total, course) => total + course.studentIds.length, 0))
  const availableSeats = computed(() => totalCapacity.value - totalAssigned.value)
  const fullCoursesCount = computed(() => courses.value.filter((course) => course.studentIds.length >= course.capacity).length)

  const enrolledSubjectOptions = computed(() => {
    const enrollmentsStore = useEnrollmentsStore()
    const options = new Map()

    enrollmentsStore.enrollments
      .filter((enrollment) => enrollment.status === 'Enrolled')
      .forEach((enrollment) => {
        enrollment.subjects.forEach((subject) => {
          if (!options.has(subject.code)) {
            options.set(subject.code, {
              code: subject.code,
              apiId: subject.apiId,
              name: subject.name,
              credits: subject.credits,
              program: enrollment.program,
            })
          }
        })
      })

    return [...options.values()]
  })

  async function fetchTeachers() {
    try {
      const response = await api.get('/teachers')

      teachers.value = unwrapData(response).map((teacher) =>
        teacher.name || [teacher.first_name, teacher.last_name].filter(Boolean).join(' '),
      )

      return { ok: true }
    } catch {
      return { ok: false }
    }
  }

  async function fetchCourses(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/course-groups', { params })
      const rows = unwrapData(response).map(normalizeCourseGroup)
      const hydratedRows = await Promise.all(rows.map(hydrateCourseStudents))

      courses.value = hydratedRows
      selectedCourseId.value = hydratedRows[0]?.id ?? null

      return { ok: true, courses: hydratedRows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar los grupos.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function hydrateCourseStudents(course) {
    if (!course.apiId) return course

    try {
      const response = await api.get(`/course-groups/${course.apiId}/students`)
      const subjectEnrollments = unwrapData(response)
      const studentIds = subjectEnrollments
        .map((item) => item.student?.student_code || item.student_id)
        .filter(Boolean)
      const subjectEnrollmentByStudent = Object.fromEntries(
        subjectEnrollments
          .map((item) => [item.student?.student_code || item.student_id, item.id])
          .filter(([studentId, subjectEnrollmentId]) => studentId && subjectEnrollmentId),
      )

      return { ...course, studentIds, subjectEnrollmentByStudent }
    } catch {
      return course
    }
  }

  async function createCourse(payload) {
    const selectedSubject = enrolledSubjectOptions.value.find((subject) => subject.code === payload.subjectCode)

    try {
      const response = await api.post('/course-groups', {
        subject_id: selectedSubject?.apiId,
        subject_code: payload.subjectCode,
        teacher_name: payload.teacher,
        group_code: payload.group,
        capacity: Number(payload.capacity || 0),
      })
      const course = normalizeCourseGroup(unwrapData(response))

      courses.value.unshift(course)
      selectedCourseId.value = course.id

      return { ok: true, course }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo crear el grupo.') }
    }
  }

  function eligibleStudentsForCourse(courseId) {
    const enrollmentsStore = useEnrollmentsStore()
    const studentsStore = useStudentsStore()
    const course = courses.value.find((item) => item.id === courseId)

    if (!course) return []

    const eligibleStudentIds = new Set()

    enrollmentsStore.enrollments
      .filter((enrollment) => enrollment.status === 'Enrolled')
      .forEach((enrollment) => {
        const hasSubject = enrollment.subjects.some((subject) => subject.code === course.subjectCode)

        if (hasSubject) eligibleStudentIds.add(enrollment.studentId)
      })

    return studentsStore.students.filter((student) => eligibleStudentIds.has(student.id) || eligibleStudentIds.has(student.apiId))
  }

  async function assignStudent(courseId, studentId) {
    const index = courses.value.findIndex((course) => course.id === courseId)

    if (index === -1) return { ok: false, message: 'Course was not found.' }
    if (courses.value[index].studentIds.includes(studentId)) return { ok: false, message: 'Student is already assigned to this group.' }
    if (courses.value[index].studentIds.length >= courses.value[index].capacity) return { ok: false, message: 'Course capacity is already full.' }

    const enrollmentsStore = useEnrollmentsStore()
    const studentsStore = useStudentsStore()
    const student = studentsStore.students.find((item) => item.id === studentId || item.apiId === studentId)
    const enrollment = enrollmentsStore.enrollments.find((item) => {
      const belongsToStudent = item.studentId === studentId || item.studentApiId === studentId || item.studentApiId === student?.apiId
      const hasSubject = item.subjects.some((subject) => subject.apiId === courses.value[index].raw.subject_id || subject.code === courses.value[index].subjectCode)

      return belongsToStudent && ['Enrolled', 'Payment Confirmed'].includes(item.status) && hasSubject
    })

    if (!enrollment) return { ok: false, message: 'No se encontro una matricula activa para esa asignatura.' }

    try {
      await api.post('/subject-enrollments', {
        enrollment_id: enrollment.apiId,
        student_id: student?.apiId || studentId,
        subject_offering_id: courses.value[index].apiId,
        subject_id: courses.value[index].raw.subject_id,
        course_id: courses.value[index].courseId,
        career_id: courses.value[index].careerId,
        group_id: courses.value[index].groupId,
        curriculum_plan_id: courses.value[index].curriculumPlanId,
        enrolled_at: new Date().toISOString().slice(0, 10),
        status: 'enrolled',
      })
      await fetchCourses()

      return { ok: true, course: selectedCourse.value }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo asignar el estudiante.') }
    }
  }

  function removeStudent(courseId, studentId) {
    const index = courses.value.findIndex((course) => course.id === courseId)

    if (index === -1) return { ok: false, message: 'Course was not found.' }

    courses.value[index] = {
      ...courses.value[index],
      studentIds: courses.value[index].studentIds.filter((id) => id !== studentId),
    }

    return { ok: true, course: courses.value[index] }
  }

  function selectCourse(courseId) {
    selectedCourseId.value = courseId
  }

  return {
    teachers,
    courses,
    selectedCourseId,
    selectedCourse,
    totalCapacity,
    totalAssigned,
    availableSeats,
    fullCoursesCount,
    enrolledSubjectOptions,
    loading,
    error,
    fetchTeachers,
    fetchCourses,
    createCourse,
    eligibleStudentsForCourse,
    assignStudent,
    removeStudent,
    selectCourse,
  }
})
