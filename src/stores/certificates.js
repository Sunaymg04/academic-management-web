import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizeCertificate } from '@/services/normalizers'
import { useStudentsStore } from '@/stores/students'

const certificateTypes = ['Enrollment Certificate', 'Grade Certificate', 'Active Student Letter']

function toBackendType(type) {
  return String(type || '')
    .toLowerCase()
    .replace('enrollment certificate', 'enrollment_certificate')
    .replace('grade certificate', 'grade_certificate')
    .replace('active student letter', 'active_student_certificate')
}

export const useCertificatesStore = defineStore('certificates', () => {
  const certificates = ref([])
  const selectedCertificateId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedCertificate = computed(
    () => certificates.value.find((certificate) => certificate.id === selectedCertificateId.value) ?? certificates.value[0],
  )

  async function fetchCertificates(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/certificates', { params })
      const rows = unwrapData(response).map(normalizeCertificate)

      certificates.value = rows
      selectedCertificateId.value = rows[0]?.id ?? null

      return { ok: true, certificates: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar los certificados.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function generateCertificate(payload) {
    const studentsStore = useStudentsStore()
    const student = studentsStore.students.find((item) => item.id === payload.studentId)

    try {
      const response = await api.post('/certificates/generate', {
        student_id: student?.apiId || payload.studentId,
        type: toBackendType(payload.type),
        purpose: payload.purpose,
      })
      const certificate = normalizeCertificate(unwrapData(response))

      certificates.value.unshift(certificate)
      selectedCertificateId.value = certificate.id

      return { ok: true, certificate }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo generar el certificado.') }
    }
  }

  function downloadUrl(certificateId, format = 'pdf') {
    const certificate = certificates.value.find((item) => item.id === certificateId)
    const apiId = certificate?.apiId || certificateId

    return `${api.defaults.baseURL}/certificates/${apiId}/download?format=${format}`
  }

  function selectCertificate(certificateId) {
    selectedCertificateId.value = certificateId
  }

  return {
    certificateTypes,
    certificates,
    selectedCertificateId,
    selectedCertificate,
    loading,
    error,
    fetchCertificates,
    generateCertificate,
    downloadUrl,
    selectCertificate,
  }
})
