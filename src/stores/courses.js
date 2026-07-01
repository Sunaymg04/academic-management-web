import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useStudentsStore } from '@/stores/students'

const teachers = [
  'Ana Rodríguez',
  'Luis Medina',
  'Elena Ramos',
  'Rafael Díaz',
  'Natalia Vega',
  'Manuel Castro',
]

function buildCourseId(sequence) {
  return `CRS-2026-${String(sequence).padStart(4, '0')}`
}

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref([])
  const selectedCourseId = ref(null)

  const selectedCourse = computed(
    () => courses.value.find((course) => course.id === selectedCourseId.value) ?? courses.value[0],
  )

  const totalCapacity = computed(() =>
    courses.value.reduce((total, course) => total + course.capacity, 0),
  )

  const totalAssigned = computed(() =>
    courses.value.reduce((total, course) => total + course.studentIds.length, 0),
  )

  const availableSeats = computed(() => totalCapacity.value - totalAssigned.value)

  const fullCoursesCount = computed(
    () => courses.value.filter((course) => course.studentIds.length >= course.capacity).length,
  )

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
              name: subject.name,
              credits: subject.credits,
              program: enrollment.program,
            })
          }
        })
      })

    return [...options.values()]
  })

  function createCourse(payload) {
    const selectedSubject = enrolledSubjectOptions.value.find(
      (subject) => subject.code === payload.subjectCode,
    )
    const today = new Date().toISOString().slice(0, 10)

    const course = {
      id: buildCourseId(courses.value.length + 1),
      subjectCode: payload.subjectCode,
      subjectName: selectedSubject?.name ?? payload.subjectName,
      program: selectedSubject?.program ?? payload.program,
      teacher: payload.teacher,
      group: payload.group,
      capacity: Number(payload.capacity || 0),
      studentIds: [],
      createdAt: today,
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Course group created',
          detail: `${payload.group} opened with capacity for ${payload.capacity} students.`,
        },
      ],
    }

    courses.value.unshift(course)
    selectedCourseId.value = course.id

    return { ok: true, course }
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
        const hasSubject = enrollment.subjects.some(
          (subject) => subject.code === course.subjectCode,
        )

        if (hasSubject) eligibleStudentIds.add(enrollment.studentId)
      })

    return studentsStore.students.filter((student) => eligibleStudentIds.has(student.id))
  }

  function assignStudent(courseId, studentId) {
    const index = courses.value.findIndex((course) => course.id === courseId)

    if (index === -1) return { ok: false, message: 'Course was not found.' }

    if (courses.value[index].studentIds.includes(studentId)) {
      return { ok: false, message: 'Student is already assigned to this group.' }
    }

    if (courses.value[index].studentIds.length >= courses.value[index].capacity) {
      return { ok: false, message: 'Course capacity is already full.' }
    }

    const isEligible = eligibleStudentsForCourse(courseId).some((student) => student.id === studentId)

    if (!isEligible) {
      return { ok: false, message: 'Student is not enrolled in this subject.' }
    }

    const today = new Date().toISOString().slice(0, 10)

    courses.value[index] = {
      ...courses.value[index],
      studentIds: [...courses.value[index].studentIds, studentId],
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Student assigned',
          detail: `${studentId} assigned to ${courses.value[index].group}.`,
        },
        ...courses.value[index].history,
      ],
    }

    selectedCourseId.value = courseId

    return { ok: true, course: courses.value[index] }
  }

  function removeStudent(courseId, studentId) {
    const index = courses.value.findIndex((course) => course.id === courseId)

    if (index === -1) return { ok: false, message: 'Course was not found.' }

    const today = new Date().toISOString().slice(0, 10)

    courses.value[index] = {
      ...courses.value[index],
      studentIds: courses.value[index].studentIds.filter((id) => id !== studentId),
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Student removed',
          detail: `${studentId} removed from ${courses.value[index].group}.`,
        },
        ...courses.value[index].history,
      ],
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
    createCourse,
    eligibleStudentsForCourse,
    assignStudent,
    removeStudent,
    selectCourse,
  }
})
