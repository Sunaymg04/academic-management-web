import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useEnrollmentsStore } from '@/stores/enrollments'

const paymentMethods = ['Bank Transfer', 'Cash', 'Card', 'Scholarship Adjustment']
const paymentStatuses = ['Registered', 'Validated', 'Rejected']

function buildPaymentId(sequence) {
  return `PAY-2026-${String(sequence).padStart(4, '0')}`
}

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref([])
  const selectedPaymentId = ref(null)

  const selectedPayment = computed(
    () => payments.value.find((payment) => payment.id === selectedPaymentId.value) ?? payments.value[0],
  )

  const registeredCount = computed(
    () => payments.value.filter((payment) => payment.status === 'Registered').length,
  )
  const validatedCount = computed(
    () => payments.value.filter((payment) => payment.status === 'Validated').length,
  )
  const rejectedCount = computed(
    () => payments.value.filter((payment) => payment.status === 'Rejected').length,
  )
  const validatedAmount = computed(() =>
    payments.value
      .filter((payment) => payment.status === 'Validated')
      .reduce((total, payment) => total + payment.amount, 0),
  )

  function registerPayment(payload) {
    const today = new Date().toISOString().slice(0, 10)
    const payment = {
      id: buildPaymentId(payments.value.length + 1),
      enrollmentId: payload.enrollmentId,
      amount: Number(payload.amount || 0),
      method: payload.method,
      reference: payload.reference || buildPaymentId(payments.value.length + 1),
      status: 'Registered',
      registeredAt: today,
      validatedAt: '',
      notes: payload.notes,
      history: [
        {
          date: today,
          title: 'Payment registered',
          detail: 'Manual payment record created for financial validation.',
        },
      ],
    }

    payments.value.unshift(payment)
    selectedPaymentId.value = payment.id

    return { ok: true, payment }
  }

  function validatePayment(paymentId) {
    const enrollmentsStore = useEnrollmentsStore()
    const index = payments.value.findIndex((payment) => payment.id === paymentId)

    if (index === -1) return { ok: false, message: 'Payment was not found.' }

    const today = new Date().toISOString().slice(0, 10)
    const enrollmentResult = enrollmentsStore.validatePayment(
      payments.value[index].enrollmentId,
      payments.value[index].reference,
    )

    if (!enrollmentResult.ok) return enrollmentResult

    payments.value[index] = {
      ...payments.value[index],
      status: 'Validated',
      validatedAt: today,
      history: [
        {
          date: today,
          title: 'Payment validated',
          detail: 'Enrollment status changed to Enrolled.',
        },
        ...payments.value[index].history,
      ],
    }

    selectedPaymentId.value = paymentId

    return { ok: true, payment: payments.value[index] }
  }

  function rejectPayment(paymentId) {
    const index = payments.value.findIndex((payment) => payment.id === paymentId)

    if (index === -1) return { ok: false, message: 'Payment was not found.' }

    const today = new Date().toISOString().slice(0, 10)

    payments.value[index] = {
      ...payments.value[index],
      status: 'Rejected',
      validatedAt: today,
      history: [
        {
          date: today,
          title: 'Payment rejected',
          detail: 'Financial validation rejected this payment record.',
        },
        ...payments.value[index].history,
      ],
    }

    selectedPaymentId.value = paymentId

    return { ok: true, payment: payments.value[index] }
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
    registerPayment,
    validatePayment,
    rejectPayment,
    selectPayment,
  }
})
