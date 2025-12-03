/**
 * API endpoint URLs - SATIM REST API
 */
export const endpoints = {
  REGISTER_PAYMENT: '/register.do',
  VERIFY_PAYMENT: '/public/acknowledgeTransaction.do',
  REFUND_PAYMENT: '/refund.do',
} as const;
