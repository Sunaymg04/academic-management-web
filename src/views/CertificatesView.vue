<script setup>
import { computed, reactive, ref } from 'vue'
import {
  BadgeCheck,
  ClipboardSignature,
  FileCheck2,
  GraduationCap,
  Printer,
  Search,
  ShieldCheck,
  Stamp,
} from '@lucide/vue'
import { useCertificatesStore } from '@/stores/certificates'
import { useStudentsStore } from '@/stores/students'
import { useUiStore } from '@/stores/ui'

const certificatesStore = useCertificatesStore()
const studentsStore = useStudentsStore()
const ui = useUiStore()

const copy = {
  es: {
    title: 'Certificados Académicos',
    subtitle: 'Documentos generados desde fuentes académicas confiables',
    generate: 'Generar certificado',
    student: 'Estudiante',
    type: 'Tipo de certificado',
    purpose: 'Propósito',
    search: 'Buscar certificado o estudiante',
    generated: 'Generados',
    trustedSources: 'Fuentes verificadas',
    enrollmentCertificate: 'Certificado de matrícula',
    gradeCertificate: 'Certificado de notas',
    activeLetter: 'Constancia de estudiante activo',
    documentPreview: 'Vista previa del documento',
    certificateHistory: 'Historial de certificados',
    noCertificates: 'No hay certificados generados todavía.',
    sourceNote:
      'Este documento se arma automáticamente desde perfil, matrícula, asignaturas, notas y período académico.',
    print: 'Imprimir / exportar',
    status: 'Estado',
    program: 'Carrera',
    period: 'Período académico',
    enrollmentStatus: 'Estado de matrícula',
    average: 'Promedio',
    courses: 'Asignaturas',
    grades: 'Notas',
    generatedAt: 'Fecha de emisión',
    documentId: 'ID documento',
    activeText: 'Se hace constar que el estudiante mantiene condición académica activa.',
    enrollmentText: 'Se certifica que el estudiante posee matrícula registrada en el período indicado.',
    gradeText: 'Se certifica el resumen académico y las calificaciones registradas.',
  },
  en: {
    title: 'Academic Certificates',
    subtitle: 'Documents generated from trusted academic sources',
    generate: 'Generate certificate',
    student: 'Student',
    type: 'Certificate type',
    purpose: 'Purpose',
    search: 'Search certificate or student',
    generated: 'Generated',
    trustedSources: 'Verified sources',
    enrollmentCertificate: 'Enrollment certificate',
    gradeCertificate: 'Grade certificate',
    activeLetter: 'Active student letter',
    documentPreview: 'Document preview',
    certificateHistory: 'Certificate history',
    noCertificates: 'No certificates have been generated yet.',
    sourceNote:
      'This document is assembled automatically from profile, enrollment, courses, grades, and academic period.',
    print: 'Print / export',
    status: 'Status',
    program: 'Program',
    period: 'Academic period',
    enrollmentStatus: 'Enrollment status',
    average: 'Average',
    courses: 'Courses',
    grades: 'Grades',
    generatedAt: 'Issue date',
    documentId: 'Document ID',
    activeText: 'This confirms the student currently holds active academic standing.',
    enrollmentText: 'This certifies the student has an enrollment record for the indicated period.',
    gradeText: 'This certifies the academic summary and registered grades.',
  },
}

const typeLabels = {
  es: {
    'Enrollment Certificate': 'Certificado de matrícula',
    'Grade Certificate': 'Certificado de notas',
    'Active Student Letter': 'Constancia de estudiante activo',
  },
  en: {
    'Enrollment Certificate': 'Enrollment Certificate',
    'Grade Certificate': 'Grade Certificate',
    'Active Student Letter': 'Active Student Letter',
  },
}

const form = reactive({
  studentId: studentsStore.students[0]?.id ?? '',
  type: certificatesStore.certificateTypes[0],
  purpose: '',
})
const filters = reactive({
  search: '',
})
const feedback = ref('')

const selectedCertificate = computed(() => certificatesStore.selectedCertificate)

const filteredCertificates = computed(() => {
  const query = filters.search.trim().toLowerCase()

  if (!query) return certificatesStore.certificates

  return certificatesStore.certificates.filter((certificate) => {
    const student = certificate.snapshot.student

    return [
      certificate.id,
      certificate.type,
      student?.id,
      student?.firstName,
      student?.lastName,
      certificate.snapshot.activeEnrollment?.program,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const metricCards = computed(() => [
  {
    label: t('generated'),
    value: certificatesStore.certificates.length,
    icon: ClipboardSignature,
    tone: 'blue',
  },
  {
    label: t('trustedSources'),
    value: 5,
    icon: ShieldCheck,
    tone: 'green',
  },
  {
    label: t('enrollmentCertificate'),
    value: certificatesStore.certificates.filter((item) => item.type === 'Enrollment Certificate').length,
    icon: FileCheck2,
    tone: 'amber',
  },
  {
    label: t('gradeCertificate'),
    value: certificatesStore.certificates.filter((item) => item.type === 'Grade Certificate').length,
    icon: GraduationCap,
    tone: 'violet',
  },
])

function t(key) {
  return copy[ui.language][key]
}

function typeLabel(value) {
  return typeLabels[ui.language][value] ?? value
}

function studentName(student) {
  if (!student) return '-'

  return `${student.firstName} ${student.lastName}`
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`)

  return new Intl.DateTimeFormat(ui.language === 'es' ? 'es-ES' : 'en-US').format(date)
}

async function generateCertificate() {
  const result = await certificatesStore.generateCertificate({ ...form })

  feedback.value = result.ok ? `${result.certificate.id} ${t('generated').toLowerCase()}` : result.message
  form.purpose = ''
}

function certificateText(type) {
  if (type === 'Grade Certificate') return t('gradeText')
  if (type === 'Active Student Letter') return t('activeText')

  return t('enrollmentText')
}

function selectCertificate(certificateId) {
  certificatesStore.selectCertificate(certificateId)
}

function printCertificate() {
  window.print()
}
</script>

<template>
  <section class="certificates-page">
    <header class="page-heading">
      <div>
        <h1>{{ t('title') }}</h1>
        <p>{{ t('subtitle') }}</p>
      </div>
    </header>

    <section class="form-card">
      <div class="section-title">
        <div>
          <h2>{{ t('generate') }}</h2>
          <span>{{ t('sourceNote') }}</span>
        </div>
      </div>

      <form class="certificate-form" @submit.prevent="generateCertificate">
        <label>
          {{ t('student') }}
          <select v-model="form.studentId" required>
            <option v-for="student in studentsStore.students" :key="student.id" :value="student.id">
              {{ student.id }} · {{ student.firstName }} {{ student.lastName }}
            </option>
          </select>
        </label>

        <label>
          {{ t('type') }}
          <select v-model="form.type" required>
            <option v-for="type in certificatesStore.certificateTypes" :key="type" :value="type">
              {{ typeLabel(type) }}
            </option>
          </select>
        </label>

        <label class="wide">
          {{ t('purpose') }}
          <input v-model.trim="form.purpose" placeholder="Administrative, scholarship, external request..." />
        </label>

        <div class="form-footer">
          <p aria-live="polite">{{ feedback }}</p>
          <button type="submit" class="primary-action">
            <Stamp :size="20" />
            {{ t('generate') }}
          </button>
        </div>
      </form>
    </section>

    <section class="metrics-grid">
      <article
        v-for="card in metricCards"
        :key="card.label"
        class="metric-card"
        :class="`tone-${card.tone}`"
      >
        <span class="metric-icon">
          <component :is="card.icon" :size="28" />
        </span>
        <div>
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </article>
    </section>

    <div class="content-grid">
      <section class="list-card">
        <div class="filters-card">
          <label class="search-field">
            {{ t('search') }}
            <span>
              <Search :size="20" />
              <input v-model="filters.search" type="search" :placeholder="t('search')" />
            </span>
          </label>
        </div>

        <div class="certificate-table" role="table" aria-label="Certificate records">
          <div class="certificate-row table-head" role="row">
            <span>ID</span>
            <span>{{ t('student') }}</span>
            <span>{{ t('type') }}</span>
            <span>{{ t('period') }}</span>
            <span>{{ t('generatedAt') }}</span>
          </div>

          <button
            v-for="certificate in filteredCertificates"
            :key="certificate.id"
            type="button"
            class="certificate-row"
            :class="{ selected: selectedCertificate?.id === certificate.id }"
            @click="selectCertificate(certificate.id)"
          >
            <span>{{ certificate.id }}</span>
            <span>{{ studentName(certificate.snapshot.student) }}</span>
            <span>{{ typeLabel(certificate.type) }}</span>
            <span>{{ certificate.snapshot.activeEnrollment?.academicPeriod ?? '-' }}</span>
            <span>{{ formatDate(certificate.generatedAt) }}</span>
          </button>

          <p v-if="!filteredCertificates.length" class="empty-state">{{ t('noCertificates') }}</p>
        </div>
      </section>

      <aside v-if="selectedCertificate" class="source-card">
        <h2>
          <BadgeCheck :size="20" />
          {{ t('trustedSources') }}
        </h2>
        <ul>
          <li v-for="source in selectedCertificate.snapshot.sources" :key="source">
            <ShieldCheck :size="17" />
            {{ source }}
          </li>
        </ul>
      </aside>
    </div>

    <section v-if="selectedCertificate" class="document-card">
      <div class="document-toolbar">
        <h2>{{ t('documentPreview') }}</h2>
        <button type="button" class="outline-action" @click="printCertificate">
          <Printer :size="19" />
          {{ t('print') }}
        </button>
      </div>

      <article class="certificate-document">
        <header>
          <div class="seal">
            <GraduationCap :size="42" />
          </div>
          <div>
            <strong>Universidad Nacional</strong>
            <span>Vicerrectorado Académico</span>
          </div>
          <mark>{{ selectedCertificate.id }}</mark>
        </header>

        <h3>{{ typeLabel(selectedCertificate.type) }}</h3>
        <p class="lead">
          {{ certificateText(selectedCertificate.type) }}
        </p>

        <dl class="document-grid">
          <div>
            <dt>{{ t('documentId') }}</dt>
            <dd>{{ selectedCertificate.id }}</dd>
          </div>
          <div>
            <dt>{{ t('generatedAt') }}</dt>
            <dd>{{ formatDate(selectedCertificate.generatedAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('student') }}</dt>
            <dd>{{ studentName(selectedCertificate.snapshot.student) }}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{{ selectedCertificate.snapshot.student?.id }}</dd>
          </div>
          <div>
            <dt>{{ t('program') }}</dt>
            <dd>{{ selectedCertificate.snapshot.activeEnrollment?.program ?? selectedCertificate.snapshot.student?.program }}</dd>
          </div>
          <div>
            <dt>{{ t('period') }}</dt>
            <dd>{{ selectedCertificate.snapshot.activeEnrollment?.academicPeriod ?? selectedCertificate.snapshot.student?.admissionTerm }}</dd>
          </div>
          <div>
            <dt>{{ t('enrollmentStatus') }}</dt>
            <dd>{{ selectedCertificate.snapshot.activeEnrollment?.status ?? selectedCertificate.snapshot.student?.enrollmentStatus }}</dd>
          </div>
          <div>
            <dt>{{ t('average') }}</dt>
            <dd>{{ selectedCertificate.snapshot.transcript.average }}</dd>
          </div>
        </dl>

        <section v-if="selectedCertificate.type === 'Grade Certificate'" class="document-section">
          <h4>{{ t('grades') }}</h4>
          <table>
            <thead>
              <tr>
                <th>{{ t('courses') }}</th>
                <th>{{ t('grades') }}</th>
                <th>{{ t('status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in selectedCertificate.snapshot.transcript.records" :key="record.id">
                <td>{{ record.subjectCode }} · {{ record.subjectName }}</td>
                <td>{{ record.score ?? '-' }}</td>
                <td>{{ record.status }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-else class="document-section">
          <h4>{{ t('courses') }}</h4>
          <ul>
            <li v-for="course in selectedCertificate.snapshot.assignedCourses" :key="course.id">
              {{ course.subjectCode }} · {{ course.subjectName }} · {{ course.group }}
            </li>
          </ul>
        </section>

        <footer>
          <span>{{ t('sourceNote') }}</span>
          <strong>Academic Registry</strong>
        </footer>
      </article>
    </section>
  </section>
</template>

<style scoped>
.certificates-page {
  display: grid;
  gap: 22px;
  padding: 28px 30px 36px;
}

.page-heading h1 {
  margin: 0 0 8px;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 2.45rem);
  line-height: 1.05;
}

.page-heading p,
.section-title span,
.empty-state {
  margin: 0;
  color: var(--muted);
}

.form-card,
.metric-card,
.list-card,
.source-card,
.document-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.form-card,
.list-card,
.source-card,
.document-card {
  padding: 18px;
}

.section-title,
.document-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title h2,
.document-toolbar h2,
.source-card h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.certificate-form {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(220px, 1fr) minmax(260px, 1.2fr);
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 800;
}

input,
select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--text);
  background: var(--panel);
}

.form-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}

.form-footer p {
  margin: 0;
  color: var(--muted);
  font-weight: 750;
}

.primary-action,
.outline-action {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 8px;
  padding: 0 16px;
  font-weight: 850;
}

.primary-action {
  border: 0;
  color: #ffffff;
  background: var(--primary);
}

.outline-action {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: transparent;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 16px;
}

.metric-card {
  min-height: 118px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
}

.metric-icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
}

.tone-blue .metric-icon {
  background: #1475f8;
}

.tone-green .metric-icon {
  background: #22b85f;
}

.tone-amber .metric-icon {
  background: #ff9f1c;
}

.tone-violet .metric-icon {
  background: #7c7cff;
}

.metric-card div > span {
  display: block;
  color: var(--muted);
}

.metric-card strong {
  display: block;
  margin-top: 6px;
  color: var(--text);
  font-size: 1.75rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 18px;
  align-items: start;
}

.filters-card {
  margin-bottom: 14px;
}

.search-field span {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 12px;
}

.search-field input {
  border: 0;
  padding: 0;
}

.certificate-table {
  overflow-x: auto;
}

.certificate-row {
  width: 100%;
  min-width: 760px;
  display: grid;
  grid-template-columns: 138px 1.2fr 1.1fr 120px 130px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 13px 10px;
  color: var(--text);
  background: transparent;
  text-align: left;
}

.certificate-row:not(.table-head):hover,
.certificate-row.selected {
  background: var(--primary-soft);
  outline: 1px solid color-mix(in srgb, var(--primary) 32%, transparent);
}

.table-head {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 850;
}

.source-card ul {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.source-card li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}

.certificate-document {
  max-width: 920px;
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 34px;
  color: #111827;
  background: #ffffff;
}

.certificate-document header {
  display: grid;
  grid-template-columns: 70px 1fr auto;
  gap: 16px;
  align-items: center;
  border-bottom: 2px solid #0a4a98;
  padding-bottom: 18px;
}

.seal {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border: 3px solid #0a4a98;
  border-radius: 50%;
  color: #0a4a98;
}

.certificate-document header strong,
.certificate-document header span {
  display: block;
}

.certificate-document header strong {
  color: #0a3a79;
  font-size: 1.35rem;
}

.certificate-document header mark {
  border-radius: 6px;
  padding: 8px 10px;
  color: #0a3a79;
  background: #eef6ff;
  font-weight: 850;
}

.certificate-document h3 {
  margin: 30px 0 12px;
  text-align: center;
  text-transform: uppercase;
}

.lead {
  margin: 0 auto 24px;
  max-width: 720px;
  color: #374151;
  line-height: 1.7;
  text-align: center;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

dt {
  margin-bottom: 5px;
  color: #4b5563;
  font-size: 0.82rem;
  font-weight: 850;
}

dd {
  margin: 0;
  color: #111827;
  font-weight: 750;
}

.document-section {
  margin-top: 24px;
}

.document-section h4 {
  margin: 0 0 10px;
}

.document-section table {
  width: 100%;
  border-collapse: collapse;
}

.document-section th,
.document-section td {
  border-bottom: 1px solid #d1d5db;
  padding: 10px;
  text-align: left;
}

.document-section ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
}

.certificate-document footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 32px;
  border-top: 1px solid #d1d5db;
  padding-top: 18px;
  color: #4b5563;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .certificate-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .certificates-page {
    padding: 20px;
  }

  .certificate-form,
  .document-grid {
    grid-template-columns: 1fr;
  }

  .form-footer,
  .section-title,
  .document-toolbar,
  .certificate-document header,
  .certificate-document footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
