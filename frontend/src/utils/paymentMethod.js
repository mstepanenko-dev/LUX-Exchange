export const formatPaymentMethod = (paymentMethod) => `${paymentMethod.brand || 'Card'} •••• ${paymentMethod.last4 || '••••'}`
