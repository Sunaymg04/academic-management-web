import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import {
  normalizeApplicant,
  normalizeApplicationDocument,
  toBackendApplicant,
  toBackendApplicationDocument,
} from '@/services/normalizers'
import { useStudentsStore } from '@/stores/students'

const currentYear = new Date().getFullYear()
const documentTypes = ['identity', 'transcript', 'photo', 'medical', 'recommendation', 'other']
const documentStatuses = ['pending', 'verified', 'rejected']
const applicantStatuses = ['draft', 'submitted', 'approved', 'waitlisted', 'rejected', 'returned', 'converted']

function nextApplicantCode(sequence) {
  return `APP-${currentYear}-${String(sequence).padStart(4, '0')}`
}

export const useAdmissionsStore = defineStore('admissions', () => {
  const applicants = ref([])
  const documents = ref([])
  const selectedApplicantId = ref(null)
  const selectedDocumentId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedApplicant = computed(
    () => applicants.value.find((applicant) => applicant.id === selectedApplicantId.value) ?? applicants.value[0],
  )
  const selectedDocument = computed(
    () => documents.value.find((document) => document.id === selectedDocumentId.value) ?? documents.value[0],
  )
  const pendingDocumentsCount = computed(
    () => documents.value.filter((document) => document.status === 'pending').length,
  )
  const submittedCount = computed(
    () => applicants.value.filter((applicant) => ['submitted', 'approved', 'waitlisted'].includes(applicant.status)).length,
  )
  const convertedCount = computed(
    () => applicants.value.filter((applicant) => applicant.status === 'converted').length,
  )
  const nextApplicantId = computed(() => nextApplicantCode(applicants.value.length + 1))

  async function fetchApplicants(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/applicants', { params })
      const rows = unwrapData(response).map(normalizeApplicant)

      applicants.value = rows
      selectedApplicantId.value = rows[0]?.id ?? null

      return { ok: true, applicants: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar los aspirantes.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchDocuments(params = {}) {
    try {
      const response = await api.get('/application-documents', { params })
      const rows = unwrapData(response).map(normalizeApplicationDocument)

      documents.value = rows
      selectedDocumentId.value = rows[0]?.id ?? null

      return { ok: true, documents: rows }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudieron cargar los documentos.') }
    }
  }

  async function createApplicant(payload) {
    try {
      const response = await api.post('/applicants', toBackendApplicant({ ...payload, id: nextApplicantId.value }))
      const applicant = normalizeApplicant(unwrapData(response))

      applicants.value.unshift(applicant)
      selectedApplicantId.value = applicant.id

      return { ok: true, applicant }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo crear el aspirante.') }
    }
  }

  async function submitApplicant(applicantId) {
    const applicant = applicants.value.find((item) => item.id === applicantId)

    if (!applicant) return { ok: false, message: 'No se encontro el aspirante.' }

    try {
      const response = await api.post(`/applicants/${applicant.apiId}/submit`)
      const updated = normalizeApplicant(unwrapData(response))
      const index = applicants.value.findIndex((item) => item.id === applicantId)

      applicants.value[index] = updated
      selectedApplicantId.value = updated.id

      return { ok: true, applicant: updated }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo enviar la solicitud.') }
    }
  }

  async function convertApplicant(applicantId, payload) {
    const applicant = applicants.value.find((item) => item.id === applicantId)
    const studentsStore = useStudentsStore()

    if (!applicant) return { ok: false, message: 'No se encontro el aspirante.' }

    try {
      const response = await api.post(`/applicants/${applicant.apiId}/convert-to-student`, payload)
      const updated = normalizeApplicant(response.data?.applicant)
      const index = applicants.value.findIndex((item) => item.id === applicantId)

      applicants.value[index] = updated
      selectedApplicantId.value = updated.id
      await studentsStore.fetchStudents()

      return { ok: true, applicant: updated, student: response.data?.student }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo convertir el aspirante.') }
    }
  }

  async function saveDocument(payload) {
    const applicant = applicants.value.find((item) => item.id === payload.applicantId)
    const body = toBackendApplicationDocument({
      ...payload,
      applicantApiId: applicant?.apiId || payload.applicantApiId,
    })

    try {
      const response = payload.apiId
        ? await api.put(`/application-documents/${payload.apiId}`, body)
        : await api.post('/application-documents', body)
      const document = normalizeApplicationDocument(unwrapData(response))
      const index = documents.value.findIndex((item) => item.apiId === document.apiId)

      if (index >= 0) documents.value[index] = document
      else documents.value.unshift(document)

      selectedDocumentId.value = document.id
      await fetchApplicants()

      return { ok: true, document }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo guardar el documento.') }
    }
  }

  function selectApplicant(applicantId) {
    selectedApplicantId.value = applicantId
  }

  function selectDocument(documentId) {
    selectedDocumentId.value = documentId
  }

  return {
    documentTypes,
    documentStatuses,
    applicantStatuses,
    applicants,
    documents,
    selectedApplicantId,
    selectedDocumentId,
    selectedApplicant,
    selectedDocument,
    pendingDocumentsCount,
    submittedCount,
    convertedCount,
    nextApplicantId,
    loading,
    error,
    fetchApplicants,
    fetchDocuments,
    createApplicant,
    submitApplicant,
    convertApplicant,
    saveDocument,
    selectApplicant,
    selectDocument,
  }
})
