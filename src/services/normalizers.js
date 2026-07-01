const enrollmentStatusMap = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  payment_confirmed: 'Payment Confirmed',
  active: 'Enrolled',
  enrolled: 'Enrolled',
  cancelled: 'Cancelled',
}

const paymentStatusMap = {
  registered: 'Registered',
  pending: 'Registered',
  confirmed: 'Validated',
  validated: 'Validated',
  rejected: 'Rejected',
}

const gradeStatusMap = {
  pending: 'Pending Grade',
  pending_grade: 'Pending Grade',
  published: 'Completed',
  completed: 'Completed',
  passed: 'Passed',
  failed: 'Failed',
}

const academicStatusMap = {
  active: 'Active',
  enrolled: 'Active',
  in_risk: 'At Risk',
  at_risk: 'At Risk',
  risk: 'At Risk',
  graduated: 'Graduated',
  inactive: 'Inactive',
  cancelled: 'Inactive',
}

function titleStatus(value, map, fallback = value) {
  if (!value) return fallback

  return map[String(value).toLowerCase()] ?? fallback
}

function pickName(entity, fallback = '') {
  return entity?.name || entity?.title || entity?.label || fallback
}

function pickDate(...values) {
  return values.find(Boolean)?.slice?.(0, 10) ?? ''
}

export function normalizeStudent(student) {
  const faculty = student.faculty || student.career?.faculty || student.group?.career?.faculty
  const program = student.program || student.career || student.group?.career
  const status = student.status || student.academic_status

  return {
    raw: student,
    id: student.student_code || student.code || `STU-${student.id}`,
    apiId: student.id,
    firstName: student.first_name || student.firstName || '',
    lastName: student.last_name || student.lastName || '',
    documentId: student.document_number || student.documentId || '',
    documentType: student.document_type || 'carnet',
    email: student.email || '',
    phone: student.phone || '',
    program: pickName(program, student.program_name || ''),
    programId: program?.id || student.career_id || student.program_id || student.group?.career_id || null,
    faculty: pickName(faculty, student.faculty_name || ''),
    facultyId: faculty?.id || student.faculty_id || program?.faculty_id || null,
    academicStatus: titleStatus(status, academicStatusMap, 'Active'),
    enrollmentStatus: titleStatus(
      student.enrollment_status || student.current_enrollment?.status,
      enrollmentStatusMap,
      'Draft',
    ),
    admissionTerm:
      student.admission_term ||
      student.current_enrollment?.course?.name ||
      student.current_enrollment?.academic_period?.name ||
      '',
    admissionDate: pickDate(student.admission_date, student.created_at),
    lastUpdated: pickDate(student.updated_at, student.created_at),
    academicRisk: student.academic_risk || student.risk || 'Low',
    gpa: Number(student.gpa ?? student.academic_summary?.gpa ?? 0),
    creditsCompleted: Number(student.credits_completed ?? student.academic_summary?.credits_completed ?? 0),
    advisor: student.advisor || student.tutor || '',
    duplicateValidated: Boolean(student.identity_validated ?? student.duplicate_checked_at ?? true),
    observation: student.observation || student.notes || '',
    enrollments: (student.enrollments || []).map(normalizeEnrollment),
    history: normalizeHistory(student.academic_history || student.history),
  }
}

export function normalizeEnrollment(enrollment) {
  const period = enrollment.academic_period || enrollment.course || enrollment.start_course
  const program = enrollment.program || enrollment.career || enrollment.student?.career
  const faculty = enrollment.faculty || program?.faculty
  const subjects =
    enrollment.subjects ||
    enrollment.subject_enrollments?.map((item) => item.subject || item.subject_offering?.subject || item) ||
    enrollment.enrollment_courses ||
    []

  return {
    raw: enrollment,
    id: enrollment.enrollment_code || enrollment.code || `ENR-${enrollment.id}`,
    apiId: enrollment.id,
    studentId:
      enrollment.student?.student_code ||
      enrollment.student_code ||
      enrollment.student_id ||
      enrollment.studentId,
    studentApiId: enrollment.student_id || enrollment.student?.id || null,
    academicPeriod: pickName(period, enrollment.academic_period_name || ''),
    academicPeriodId: period?.id || enrollment.course_id || enrollment.academic_period_id || null,
    program: pickName(program, enrollment.program_name || enrollment.career_name || ''),
    programId: program?.id || enrollment.career_id || enrollment.program_id || null,
    faculty: pickName(faculty, enrollment.faculty_name || ''),
    status: titleStatus(enrollment.status, enrollmentStatusMap, 'Draft'),
    subjects: subjects.map(normalizeSubject),
    totalCredits: Number(enrollment.total_credits ?? 0),
    totalAmount: Number(enrollment.total_amount ?? enrollment.amount ?? 0),
    createdAt: pickDate(enrollment.created_at, enrollment.enrollment_date),
    updatedAt: pickDate(enrollment.updated_at, enrollment.enrolled_at, enrollment.enrollment_date),
    paymentReference: enrollment.payment_reference || '',
    notes: enrollment.notes || '',
    history: normalizeHistory(enrollment.history),
  }
}

export function normalizeSubject(subject) {
  const source = subject.subject || subject

  return {
    raw: subject,
    code: source.code || source.subject_code || `SUB-${source.id}`,
    apiId: source.id,
    name: source.name || source.subject_name || '',
    credits: Number(source.credits ?? subject.credits ?? 0),
  }
}

export function normalizePayment(payment) {
  return {
    raw: payment,
    id: payment.payment_code || payment.payment_reference || payment.reference || `PAY-${payment.id}`,
    apiId: payment.id,
    enrollmentId: payment.enrollment?.enrollment_code || payment.enrollment_id || payment.enrollmentId,
    enrollmentApiId: payment.enrollment_id || payment.enrollment?.id || null,
    studentId: payment.student?.student_code || payment.student_id || payment.studentId,
    amount: Number(payment.amount ?? 0),
    currency: payment.currency || 'USD',
    method: payment.payment_method || payment.method || 'manual',
    reference: payment.payment_reference || payment.reference || '',
    status: titleStatus(payment.status, paymentStatusMap, 'Registered'),
    registeredAt: pickDate(payment.created_at, payment.paid_at),
    validatedAt: pickDate(payment.validated_at, payment.updated_at),
    notes: payment.notes || payment.rejection_reason || '',
    history: normalizeHistory(payment.history),
  }
}

export function normalizeCourseGroup(group) {
  const subject = group.subject || group.course || {}
  const teacher = group.professor || group.teacher || {}
  const program = group.career || group.program || subject.career
  const students = group.students || group.subject_enrollments?.map((item) => item.student) || []

  return {
    raw: group,
    id: group.group_code || group.code || `CRS-${group.id}`,
    apiId: group.id,
    subjectCode: subject.code || group.subject_code || group.course_code || `SUB-${subject.id || group.id}`,
    subjectName: subject.name || group.subject_name || group.name || '',
    program: pickName(program, group.program_name || group.career_name || ''),
    teacher:
      teacher.name ||
      [teacher.first_name, teacher.last_name].filter(Boolean).join(' ') ||
      group.teacher_name ||
      '',
    teacherId: teacher.id || group.teacher_id || group.professor_id || null,
    group: group.group_code || group.code || group.name || '',
    capacity: Number(group.capacity ?? 0),
    studentIds: students.map((student) => student?.student_code || student?.id).filter(Boolean),
    createdAt: pickDate(group.created_at),
    updatedAt: pickDate(group.updated_at),
    history: normalizeHistory(group.history),
  }
}

export function normalizeGrade(grade) {
  const student = grade.student || {}
  const course = grade.course || grade.subject || grade.subject_offering?.subject || {}
  const offering = grade.subject_offering || grade.course_group || {}

  return {
    raw: grade,
    id: grade.grade_code || `GRD-${grade.id}`,
    apiId: grade.id,
    studentId: student.student_code || grade.student_id,
    studentApiId: grade.student_id || student.id || null,
    courseId: offering.group_code || offering.code || grade.course_group_id || grade.subject_offering_id,
    courseApiId: grade.subject_offering_id || grade.course_group_id || offering.id || null,
    subjectCode: course.code || grade.subject_code || '',
    subjectName: course.name || grade.subject_name || '',
    group: offering.group_code || offering.code || '',
    teacher: offering.professor?.name || offering.teacher?.name || '',
    score: grade.raw_value ?? grade.grade ?? grade.value ?? null,
    status: titleStatus(grade.status, gradeStatusMap, 'Pending Grade'),
    createdAt: pickDate(grade.created_at),
    updatedAt: pickDate(grade.updated_at),
    history: normalizeHistory(grade.audit_logs || grade.history),
  }
}

export function normalizeCertificate(certificate) {
  return {
    raw: certificate,
    id: certificate.certificate_code || certificate.code || `CERT-${certificate.id}`,
    apiId: certificate.id,
    studentId: certificate.student?.student_code || certificate.student_id,
    studentApiId: certificate.student_id || certificate.student?.id || null,
    type: certificate.type || '',
    purpose: certificate.purpose || '',
    generatedAt: pickDate(certificate.generated_at, certificate.created_at),
    status: titleStatus(certificate.status, { generated: 'Generated', cancelled: 'Cancelled' }, 'Generated'),
    verificationCode: certificate.verification_code || '',
    snapshot: certificate.snapshot_data || certificate.snapshot || {},
    history: normalizeHistory(certificate.history),
  }
}

export function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return []

  return history.map((item) => ({
    date: pickDate(item.date, item.changed_at, item.created_at),
    title: item.title || item.event || item.action || 'Actualizado',
    detail: item.detail || item.description || item.reason || item.message || '',
  }))
}

export function toBackendStudent(payload) {
  return {
    student_code: payload.id,
    first_name: payload.firstName,
    last_name: payload.lastName,
    document_type: payload.documentType || 'carnet',
    document_number: payload.documentId,
    email: payload.email,
    phone: payload.phone,
    career_id: payload.programId,
    faculty_id: payload.facultyId,
    admission_date: payload.admissionDate,
    status: payload.academicStatus?.toLowerCase().replaceAll(' ', '_') || 'active',
  }
}

export function toBackendEnrollment(payload) {
  return {
    student_id: payload.studentApiId || payload.studentId,
    start_course_id: payload.academicPeriodId || payload.startCourseId,
    career_id: payload.programId,
    enrollment_date: payload.enrollmentDate || new Date().toISOString().slice(0, 10),
    status: 'active',
    subject_codes: payload.subjectCodes,
    notes: payload.notes,
  }
}
