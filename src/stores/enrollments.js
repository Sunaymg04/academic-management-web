import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStudentsStore } from '@/stores/students'

const academicPeriods = ['2026-I', '2026-II', '2027-I']

const programCatalog = [
  {
    name: 'Computer Science',
    faculty: 'Ingeniería',
    subjects: [
      { code: 'CS-201', name: 'Data Structures', credits: 4 },
      { code: 'CS-240', name: 'Database Systems', credits: 3 },
      { code: 'CS-310', name: 'Software Engineering', credits: 4 },
      { code: 'MATH-220', name: 'Discrete Mathematics', credits: 3 },
    ],
  },
  {
    name: 'Industrial Engineering',
    faculty: 'Ingeniería',
    subjects: [
      { code: 'IE-210', name: 'Operations Research', credits: 4 },
      { code: 'IE-245', name: 'Production Systems', credits: 3 },
      { code: 'STAT-205', name: 'Applied Statistics', credits: 3 },
      { code: 'MGMT-230', name: 'Project Management', credits: 3 },
    ],
  },
  {
    name: 'Business Administration',
    faculty: 'Ciencias Económicas',
    subjects: [
      { code: 'BA-200', name: 'Financial Accounting', credits: 3 },
      { code: 'BA-215', name: 'Organizational Behavior', credits: 3 },
      { code: 'ECON-210', name: 'Microeconomics', credits: 4 },
      { code: 'MKT-220', name: 'Marketing Strategy', credits: 3 },
    ],
  },
  {
    name: 'Psychology',
    faculty: 'Ciencias Sociales',
    subjects: [
      { code: 'PSY-210', name: 'Developmental Psychology', credits: 3 },
      { code: 'PSY-250', name: 'Research Methods', credits: 4 },
      { code: 'SOC-205', name: 'Social Theory', credits: 3 },
      { code: 'PSY-280', name: 'Clinical Interviewing', credits: 3 },
    ],
  },
  {
    name: 'Civil Engineering',
    faculty: 'Ingeniería',
    subjects: [
      { code: 'CE-220', name: 'Structural Analysis', credits: 4 },
      { code: 'CE-240', name: 'Soil Mechanics', credits: 3 },
      { code: 'CE-260', name: 'Hydraulics', credits: 3 },
      { code: 'MATH-240', name: 'Differential Equations', credits: 4 },
    ],
  },
]

const statusFlow = ['Draft', 'Pending Payment', 'Payment Confirmed', 'Enrolled', 'Cancelled']

function buildEnrollmentId(sequence) {
  return `ENR-2026-${String(sequence).padStart(4, '0')}`
}

function initialStatus(subjects) {
  return subjects.length ? 'Pending Payment' : 'Draft'
}

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const enrollments = ref([])
  const selectedEnrollmentId = ref(null)

  const selectedEnrollment = computed(
    () =>
      enrollments.value.find((enrollment) => enrollment.id === selectedEnrollmentId.value) ??
      enrollments.value[0],
  )

  const programs = computed(() => programCatalog.map((program) => program.name))
  const pendingPaymentCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Pending Payment').length,
  )
  const enrolledCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Enrolled').length,
  )
  const draftCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Draft').length,
  )
  const cancelledCount = computed(
    () => enrollments.value.filter((enrollment) => enrollment.status === 'Cancelled').length,
  )

  function getProgram(name) {
    return programCatalog.find((program) => program.name === name) ?? programCatalog[0]
  }

  function getSubjectsByProgram(programName) {
    return getProgram(programName).subjects
  }

  function createEnrollment(payload) {
    const studentsStore = useStudentsStore()
    const program = getProgram(payload.program)
    const selectedSubjects = program.subjects.filter((subject) =>
      payload.subjectCodes.includes(subject.code),
    )
    const status = initialStatus(selectedSubjects)
    const today = new Date().toISOString().slice(0, 10)

    const enrollment = {
      id: buildEnrollmentId(enrollments.value.length + 1),
      studentId: payload.studentId,
      academicPeriod: payload.academicPeriod,
      program: program.name,
      faculty: program.faculty,
      status,
      subjects: selectedSubjects,
      totalCredits: selectedSubjects.reduce((total, subject) => total + subject.credits, 0),
      createdAt: today,
      updatedAt: today,
      paymentReference: '',
      notes: payload.notes,
      history: [
        {
          date: today,
          title: 'Enrollment created',
          detail: `Initial status set to ${status}.`,
        },
      ],
    }

    enrollments.value.unshift(enrollment)
    selectedEnrollmentId.value = enrollment.id
    studentsStore.applyEnrollment(payload.studentId, enrollment)

    return { ok: true, enrollment }
  }

  function updateStatus(enrollmentId, nextStatus) {
    const studentsStore = useStudentsStore()
    const index = enrollments.value.findIndex((enrollment) => enrollment.id === enrollmentId)

    if (index === -1 || !statusFlow.includes(nextStatus)) {
      return { ok: false, message: 'Enrollment was not found.' }
    }

    const today = new Date().toISOString().slice(0, 10)

    enrollments.value[index] = {
      ...enrollments.value[index],
      status: nextStatus,
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Status updated',
          detail: `Enrollment moved to ${nextStatus}.`,
        },
        ...enrollments.value[index].history,
      ],
    }

    studentsStore.applyEnrollment(enrollments.value[index].studentId, enrollments.value[index])

    return { ok: true, enrollment: enrollments.value[index] }
  }

  function confirmPayment(enrollmentId) {
    return updateStatus(enrollmentId, 'Payment Confirmed')
  }

  function markEnrolled(enrollmentId) {
    return updateStatus(enrollmentId, 'Enrolled')
  }

  function cancelEnrollment(enrollmentId) {
    return updateStatus(enrollmentId, 'Cancelled')
  }

  function validatePayment(enrollmentId, paymentReference) {
    const studentsStore = useStudentsStore()
    const index = enrollments.value.findIndex((enrollment) => enrollment.id === enrollmentId)

    if (index === -1) return { ok: false, message: 'Enrollment was not found.' }

    const today = new Date().toISOString().slice(0, 10)

    enrollments.value[index] = {
      ...enrollments.value[index],
      status: 'Enrolled',
      paymentReference,
      updatedAt: today,
      history: [
        {
          date: today,
          title: 'Payment validated',
          detail: `Payment ${paymentReference} validated and enrollment moved to Enrolled.`,
        },
        ...enrollments.value[index].history,
      ],
    }

    studentsStore.applyEnrollment(enrollments.value[index].studentId, enrollments.value[index])

    return { ok: true, enrollment: enrollments.value[index] }
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
