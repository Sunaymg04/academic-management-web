import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const currentYear = new Date().getFullYear()

const initialStudents = [
  {
    id: 'STU-2026-0001',
    firstName: 'María',
    lastName: 'Pérez',
    documentId: 'CI-920514',
    email: 'maria.perez@universidad.edu',
    phone: '+53 5551 2190',
    program: 'Computer Science',
    faculty: 'Ingeniería',
    academicStatus: 'Active',
    enrollmentStatus: 'Pending Payment',
    admissionTerm: '2026-I',
    admissionDate: '2024-09-03',
    lastUpdated: '2026-05-12',
    academicRisk: 'Low',
    gpa: 3.72,
    creditsCompleted: 48,
    advisor: 'Dra. Elena Ramos',
    duplicateValidated: true,
    observation:
      'Pendiente de pago de matrícula del periodo académico 2026-I. Enviar comprobante para confirmar inscripción.',
    history: [
      { date: '2024-09-03', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2024-09-04', title: 'Validado', detail: 'Identidad única confirmada.' },
      { date: '2024-09-05', title: 'Inscrito', detail: 'Programa Computer Science asignado.' },
      { date: '2026-05-12', title: 'Actualizado', detail: 'Pago de matrícula marcado como pendiente.' },
    ],
  },
  {
    id: 'STU-2026-0002',
    firstName: 'Juan',
    lastName: 'Rodríguez',
    documentId: 'CI-881203',
    email: 'juan.rodriguez@universidad.edu',
    phone: '+53 5558 7044',
    program: 'Industrial Engineering',
    faculty: 'Ingeniería',
    academicStatus: 'Active',
    enrollmentStatus: 'Enrolled',
    admissionTerm: '2026-I',
    admissionDate: '2024-09-08',
    lastUpdated: '2026-05-10',
    academicRisk: 'Low',
    gpa: 3.41,
    creditsCompleted: 30,
    advisor: 'Prof. Luis Medina',
    duplicateValidated: true,
    observation: 'Matrícula inscrita y expediente sin incidencias abiertas.',
    history: [
      { date: '2024-09-08', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2024-09-09', title: 'Validado', detail: 'Documento y correo institucional verificados.' },
      { date: '2026-05-10', title: 'Actualizado', detail: 'Estado académico activo confirmado.' },
    ],
  },
  {
    id: 'STU-2026-0003',
    firstName: 'Ana',
    lastName: 'Gómez',
    documentId: 'CI-991018',
    email: 'ana.gomez@universidad.edu',
    phone: '+53 5554 8892',
    program: 'Business Administration',
    faculty: 'Ciencias Económicas',
    academicStatus: 'At Risk',
    enrollmentStatus: 'Pending Payment',
    admissionTerm: '2026-I',
    admissionDate: '2025-02-14',
    lastUpdated: '2026-05-09',
    academicRisk: 'High',
    gpa: 2.08,
    creditsCompleted: 18,
    advisor: 'Dra. Natalia Vega',
    duplicateValidated: true,
    observation: 'Requiere seguimiento académico y regularización de pago.',
    history: [
      { date: '2025-02-14', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2025-02-15', title: 'Validado', detail: 'Identidad única confirmada.' },
      { date: '2026-05-09', title: 'En riesgo', detail: 'Promedio académico por debajo del umbral.' },
    ],
  },
  {
    id: 'STU-2026-0004',
    firstName: 'Luis',
    lastName: 'Martínez',
    documentId: 'CI-900724',
    email: 'luis.martinez@universidad.edu',
    phone: '+53 5550 3318',
    program: 'Computer Science',
    faculty: 'Ingeniería',
    academicStatus: 'Graduated',
    enrollmentStatus: 'Enrolled',
    admissionTerm: '2022-I',
    admissionDate: '2022-09-05',
    lastUpdated: '2026-05-05',
    academicRisk: 'Low',
    gpa: 3.88,
    creditsCompleted: 142,
    advisor: 'Dr. Rafael Díaz',
    duplicateValidated: true,
    observation: 'Expediente listo para cierre administrativo de graduación.',
    history: [
      { date: '2022-09-05', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2026-05-05', title: 'Graduado', detail: 'Requisitos académicos completados.' },
    ],
  },
  {
    id: 'STU-2026-0005',
    firstName: 'Carla',
    lastName: 'Torres',
    documentId: 'CI-970611',
    email: 'carla.torres@universidad.edu',
    phone: '+53 5559 1205',
    program: 'Psychology',
    faculty: 'Ciencias Sociales',
    academicStatus: 'Inactive',
    enrollmentStatus: 'Blocked',
    admissionTerm: '2025-II',
    admissionDate: '2025-09-02',
    lastUpdated: '2026-05-01',
    academicRisk: 'Medium',
    gpa: 2.96,
    creditsCompleted: 22,
    advisor: 'Lic. Marta León',
    duplicateValidated: true,
    observation: 'Cuenta bloqueada hasta completar documentación pendiente.',
    history: [
      { date: '2025-09-02', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2026-05-01', title: 'Bloqueado', detail: 'Documentación pendiente vencida.' },
    ],
  },
  {
    id: 'STU-2026-0006',
    firstName: 'Pedro',
    lastName: 'Sánchez',
    documentId: 'CI-951127',
    email: 'pedro.sanchez@universidad.edu',
    phone: '+53 5557 8840',
    program: 'Civil Engineering',
    faculty: 'Ingeniería',
    academicStatus: 'Active',
    enrollmentStatus: 'Under Review',
    admissionTerm: '2026-I',
    admissionDate: '2026-01-20',
    lastUpdated: '2026-04-30',
    academicRisk: 'Low',
    gpa: 3.2,
    creditsCompleted: 12,
    advisor: 'Ing. Manuel Castro',
    duplicateValidated: true,
    observation: 'Matrícula en revisión por cambio de plan de estudio.',
    history: [
      { date: '2026-01-20', title: 'Creado', detail: 'Expediente estudiantil generado.' },
      { date: '2026-04-30', title: 'En revisión', detail: 'Cambio de plan enviado a coordinación.' },
    ],
  },
]

function buildStudentId(sequence) {
  return `STU-${currentYear}-${String(sequence).padStart(4, '0')}`
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export const useStudentsStore = defineStore('students', () => {
  const students = ref(initialStudents)
  const selectedStudentId = ref(initialStudents[0]?.id ?? null)

  const selectedStudent = computed(
    () => students.value.find((student) => student.id === selectedStudentId.value) ?? students.value[0],
  )

  const activeCount = computed(
    () => students.value.filter((student) => student.academicStatus === 'Active').length,
  )

  const pendingEnrollmentCount = computed(
    () =>
      students.value.filter((student) => student.enrollmentStatus === 'Pending Payment').length,
  )

  const atRiskCount = computed(
    () => students.value.filter((student) => student.academicStatus === 'At Risk').length,
  )

  const duplicateValidatedCount = computed(
    () => students.value.filter((student) => student.duplicateValidated).length,
  )

  const faculties = computed(() => [...new Set(students.value.map((student) => student.faculty))])
  const programs = computed(() => [...new Set(students.value.map((student) => student.program))])
  const academicStatuses = computed(() => [
    ...new Set(students.value.map((student) => student.academicStatus)),
  ])
  const enrollmentStatuses = computed(() => [
    ...new Set(students.value.map((student) => student.enrollmentStatus)),
  ])

  const nextStudentId = computed(() => buildStudentId(students.value.length + 1))

  function findDuplicate(candidate, ignoredId = null) {
    const documentId = normalize(candidate.documentId)
    const email = normalize(candidate.email)

    return students.value.find((student) => {
      if (student.id === ignoredId) return false

      return normalize(student.documentId) === documentId || normalize(student.email) === email
    })
  }

  function createStudent(payload) {
    const duplicate = findDuplicate(payload)

    if (duplicate) {
      return {
        ok: false,
        message: `Posible duplicado detectado: ${duplicate.id} ya usa ese documento o correo.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    const student = {
      ...payload,
      id: nextStudentId.value,
      gpa: Number(payload.gpa || 0),
      creditsCompleted: Number(payload.creditsCompleted || 0),
      lastUpdated: today,
      duplicateValidated: true,
      history: [
        {
          date: today,
          title: 'Creado',
          detail: 'Registro único generado desde el módulo de estudiantes.',
        },
      ],
    }

    students.value.unshift(student)
    selectedStudentId.value = student.id

    return { ok: true, student }
  }

  function updateStudent(studentId, payload) {
    const index = students.value.findIndex((student) => student.id === studentId)

    if (index === -1) return { ok: false, message: 'No se encontró el estudiante.' }

    const duplicate = findDuplicate(payload, studentId)

    if (duplicate) {
      return {
        ok: false,
        message: `Posible duplicado detectado: ${duplicate.id} ya usa ese documento o correo.`,
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    students.value[index] = {
      ...students.value[index],
      ...payload,
      gpa: Number(payload.gpa || 0),
      creditsCompleted: Number(payload.creditsCompleted || 0),
      lastUpdated: today,
      history: [
        {
          date: today,
          title: 'Actualizado',
          detail: 'Datos personales editados desde el panel académico.',
        },
        ...students.value[index].history,
      ],
    }

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
    createStudent,
    updateStudent,
    selectStudent,
  }
})
