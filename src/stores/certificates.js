import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useCoursesStore } from '@/stores/courses'
import { useEnrollmentsStore } from '@/stores/enrollments'
import { useGradesStore } from '@/stores/grades'
import { useStudentsStore } from '@/stores/students'

const certificateTypes = [
  'Enrollment Certificate',
  'Grade Certificate',
  'Active Student Letter',
]

function buildCertificateId(sequence) {
  return `CERT-2026-${String(sequence).padStart(4, '0')}`
}

export const useCertificatesStore = defineStore('certificates', () => {
  const certificates = ref([])
  const selectedCertificateId = ref(null)

  const selectedCertificate = computed(
    () =>
      certificates.value.find((certificate) => certificate.id === selectedCertificateId.value) ??
      certificates.value[0],
  )

  function buildSourceSnapshot(studentId, type) {
    const studentsStore = useStudentsStore()
    const enrollmentsStore = useEnrollmentsStore()
    const gradesStore = useGradesStore()
    const coursesStore = useCoursesStore()

    const student = studentsStore.students.find((item) => item.id === studentId)
    const enrollments = enrollmentsStore.enrollments.filter(
      (enrollment) => enrollment.studentId === studentId,
    )
    const activeEnrollment =
      enrollments.find((enrollment) => enrollment.status === 'Enrolled') ?? enrollments[0]
    const transcript = gradesStore.transcriptForStudent(studentId)
    const assignedCourses = coursesStore.courses.filter((course) =>
      course.studentIds.includes(studentId),
    )

    return {
      type,
      student,
      activeEnrollment,
      enrollments,
      transcript,
      assignedCourses,
      sources: [
        'Student profile',
        'Enrollment status',
        'Academic period',
        'Courses',
        'Grades',
      ],
    }
  }

  function generateCertificate(payload) {
    const today = new Date().toISOString().slice(0, 10)
    const snapshot = buildSourceSnapshot(payload.studentId, payload.type)
    const certificate = {
      id: buildCertificateId(certificates.value.length + 1),
      studentId: payload.studentId,
      type: payload.type,
      purpose: payload.purpose,
      generatedAt: today,
      status: 'Generated',
      snapshot,
      history: [
        {
          date: today,
          title: 'Certificate generated',
          detail: `${payload.type} generated from trusted academic sources.`,
        },
      ],
    }

    certificates.value.unshift(certificate)
    selectedCertificateId.value = certificate.id

    return { ok: true, certificate }
  }

  function selectCertificate(certificateId) {
    selectedCertificateId.value = certificateId
  }

  return {
    certificateTypes,
    certificates,
    selectedCertificateId,
    selectedCertificate,
    generateCertificate,
    selectCertificate,
  }
})
