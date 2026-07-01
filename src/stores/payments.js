import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiMessage, unwrapData } from '@/services/api'
import { normalizePayment } from '@/services/normalizers'
import { useEnrollmentsStore } from '@/stores/enrollments'

const paymentMethods = ['manual', 'cash', 'card', 'transfer', 'scholarship_adjustment']
const paymentStatuses = ['Registered', 'Validated', 'Rejected']

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref([])
  const selectedPaymentId = ref(null)
  const loading = ref(false)
  const error = ref('')

  const selectedPayment = computed(
    () => payments.value.find((payment) => payment.id === selectedPaymentId.value) ?? payments.value[0],
  )
  const registeredCount = computed(() => payments.value.filter((payment) => payment.status === 'Registered').length)
  const validatedCount = computed(() => payments.value.filter((payment) => payment.status === 'Validated').length)
  const rejectedCount = computed(() => payments.value.filter((payment) => payment.status === 'Rejected').length)
  const validatedAmount = computed(() =>
    payments.value
      .filter((payment) => payment.status === 'Validated')
      .reduce((total, payment) => total + payment.amount, 0),
  )

  async function fetchPayments(params = {}) {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/payments', { params })
      const rows = unwrapData(response).map(normalizePayment)

      payments.value = rows
      selectedPaymentId.value = rows[0]?.id ?? null

      return { ok: true, payments: rows }
    } catch (requestError) {
      error.value = apiMessage(requestError, 'No se pudieron cargar los pagos.')

      return { ok: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function registerPayment(payload) {
    const enrollmentsStore = useEnrollmentsStore()
    const enrollment = enrollmentsStore.enrollments.find((item) => item.id === payload.enrollmentId)

    try {
      const response = await api.post('/payments', {
        student_id: enrollment?.studentApiId || enrollment?.studentId,
        enrollment_id: enrollment?.apiId || payload.enrollmentId,
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'USD',
        payment_method: payload.method,
        payment_reference: payload.reference,
        paid_at: new Date().toISOString().slice(0, 10),
        notes: payload.notes,
      })
      const payment = normalizePayment(unwrapData(response))

      payments.value.unshift(payment)
      selectedPaymentId.value = payment.id

      return { ok: true, payment }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo registrar el pago.') }
    }
  }

  async function validatePayment(paymentId) {
    const enrollmentsStore = useEnrollmentsStore()
    const index = payments.value.findIndex((payment) => payment.id === paymentId)

    if (index === -1) return { ok: false, message: 'Payment was not found.' }

    try {
      const apiId = payments.value[index].apiId || paymentId
      const response = await api.post(`/payments/${apiId}/validate`)
      const payment = normalizePayment(unwrapData(response))

      payments.value[index] = payment
      await enrollmentsStore.fetchEnrollments()
      selectedPaymentId.value = paymentId

      return { ok: true, payment }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo validar el pago.') }
    }
  }

  async function rejectPayment(paymentId, reason = 'Rejected by financial validation.') {
    const index = payments.value.findIndex((payment) => payment.id === paymentId)

    if (index === -1) return { ok: false, message: 'Payment was not found.' }

    try {
      const apiId = payments.value[index].apiId || paymentId
      const response = await api.post(`/payments/${apiId}/reject`, { reason })

      payments.value[index] = normalizePayment(unwrapData(response))
      selectedPaymentId.value = paymentId

      return { ok: true, payment: payments.value[index] }
    } catch (requestError) {
      return { ok: false, message: apiMessage(requestError, 'No se pudo rechazar el pago.') }
    }
  }

  function selectPayment(paymentId) {
    selectedPaymentId.value = paymentId
  }

  return {
    paymentMethods,
    paymentStatuses,
    payments,
    selectedPaymentId,
    selectedPayment,
    registeredCount,
    validatedCount,
    rejectedCount,
    validatedAmount,
    loading,
    error,
    fetchPayments,
    registerPayment,
    validatePayment,
    rejectPayment,
    selectPayment,
  }
})
