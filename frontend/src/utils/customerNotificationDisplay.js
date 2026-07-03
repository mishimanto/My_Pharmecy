import { safeCustomerPath } from './safeCustomerPath'

const ORDER_NUMBER_PATTERN = /\bORD-[A-Z0-9-]+\b/i
const CUSTOMER_NOTIFICATION_LINK_ROOTS = [
  '/orders',
  '/prescriptions',
  '/support',
  '/returns',
  '/notifications',
  '/account',
]

const statusLabelsBn = {
  pending_confirmation: 'কনফার্মেশনের অপেক্ষায়',
  prescription_review: 'প্রেসক্রিপশন রিভিউতে',
  confirmed: 'কনফার্ম হয়েছে',
  processing: 'প্রসেসিং হচ্ছে',
  delivered: 'ডেলিভার হয়েছে',
  cancelled: 'বাতিল হয়েছে',
  returned: 'রিটার্ন হয়েছে',
  refunded: 'রিফান্ড হয়েছে',
  awaiting_proof: 'পেমেন্ট প্রুফের অপেক্ষায়',
  under_review: 'রিভিউতে আছে',
  paid: 'পেইড',
  rejected: 'রিজেক্টেড',
  failed: 'ফেইলড',
}

const customerNotificationTypeLabels = {
  order_status_update: ['অর্ডার আপডেট', 'Order update'],
  new_order: ['অর্ডার আপডেট', 'Order update'],
  prescription_review: ['প্রেসক্রিপশন রিভিউ', 'Prescription review'],
  prescription_clarification: ['প্রেসক্রিপশন তথ্য প্রয়োজন', 'Prescription clarification'],
  payment_update: ['পেমেন্ট আপডেট', 'Payment update'],
  support_reply: ['সাপোর্ট রিপ্লাই', 'Support reply'],
  return_status_update: ['রিটার্ন আপডেট', 'Return update'],
  refund_update: ['রিফান্ড আপডেট', 'Refund update'],
}

const customerNotificationTitleLabels = {
  prescription_clarification: ['প্রেসক্রিপশন নিয়ে আরও তথ্য প্রয়োজন', 'Prescription clarification needed'],
  prescription_review: ['প্রেসক্রিপশন রিভিউ আপডেট', 'Prescription review update'],
  order_status_update: ['অর্ডার স্ট্যাটাস আপডেট', 'Order status updated'],
  new_order: ['অর্ডার গ্রহণ হয়েছে', 'Order received'],
  support_reply: ['সাপোর্ট টিকিটে রিপ্লাই এসেছে', 'Support reply received'],
  return_status_update: ['রিটার্ন স্ট্যাটাস আপডেট', 'Return status updated'],
  refund_update: ['রিফান্ড আপডেট', 'Refund updated'],
}

function labelStatus(value) {
  return statusLabelsBn[value] || String(value || '').replace(/_/g, ' ')
}

function cleanPath(path) {
  const safePath = safeCustomerPath(path, '')

  if (!safePath) {
    return ''
  }

  return CUSTOMER_NOTIFICATION_LINK_ROOTS.some((root) => safePath === root || safePath.startsWith(`${root}/`))
    ? safePath
    : ''
}

function orderNumberFromText(...values) {
  const text = values.filter(Boolean).join(' ')
  const match = text.match(ORDER_NUMBER_PATTERN)

  return match?.[0] || ''
}

function supportSubjectFromText(notification) {
  const metadataSubject = String(notification?.metadata?.ticket_subject || '').trim()
  if (metadataSubject) {
    return metadataSubject
  }

  const rawTitle = String(notification?.title || '').trim()
  const rawMessage = String(notification?.message || '').trim()

  const banglaMatch = rawMessage.match(/আপনার ['"]?(.+?)['"]? টিকিটে নতুন উত্তর দেওয়া হয়েছে/u)
  if (banglaMatch?.[1]) {
    return banglaMatch[1].trim()
  }

  const englishMatch = rawMessage.match(/support ticket:\s*(.+?)\.?$/i)
  if (englishMatch?.[1]) {
    return englishMatch[1].trim()
  }

  if (!/support reply/i.test(rawTitle) && !/সাপোর্ট/.test(rawTitle) && rawTitle) {
    return rawTitle
  }

  return ''
}

function cleanEnglishMessage(rawMessage) {
  return rawMessage
    .replace(/\s+by the admin team/gi, '')
    .replace(/\s+by admin team/gi, '')
    .replace(/the admin team will verify it\./gi, 'We will verify it shortly.')
    .replace(/the admin will review it\./gi, 'We will review it shortly.')
    .replace(/waiting for admin confirmation/gi, 'waiting for confirmation')
    .replace(/admin confirmation/gi, 'confirmation')
    .replace(/\s+\./g, '.')
    .replace(/\.{2,}/g, '.')
    .trim()
}

export function getCustomerNotificationTypeLabel(type, isBangla = false) {
  const labels = customerNotificationTypeLabels[type] || ['নোটিফিকেশন', 'Notification']
  return isBangla ? labels[0] : labels[1]
}

export function getCustomerNotificationTitle(notification, isBangla = false) {
  const item = notification || {}
  const rawTitle = String(item.title || '').trim()

  if (item.notification_type === 'payment_update') {
    if (isBangla) {
      return /verified/i.test(rawTitle)
        ? 'পেমেন্ট যাচাই হয়েছে'
        : 'পেমেন্ট আপডেট'
    }

    return rawTitle || 'Payment update'
  }

  const labels = customerNotificationTitleLabels[item.notification_type]
  if (labels) {
    return isBangla ? labels[0] : labels[1]
  }

  return rawTitle || getCustomerNotificationTypeLabel(item.notification_type, isBangla)
}

export function getCustomerNotificationLink(notification) {
  const metadata = notification?.metadata || {}
  const metadataLink = cleanPath(metadata.link)

  if (metadataLink) {
    return metadataLink
  }

  if (metadata.resource === 'orders' && metadata.resource_id) {
    return `/orders/${encodeURIComponent(metadata.order_number || metadata.resource_id)}`
  }

  if (metadata.order_number) {
    return `/orders/${encodeURIComponent(metadata.order_number)}`
  }

  if (metadata.prescription_id) {
    return `/prescriptions/${encodeURIComponent(metadata.prescription_id)}`
  }

  if (metadata.ticket_reference) {
    return `/support/${encodeURIComponent(metadata.ticket_reference)}`
  }

  const orderNumber = orderNumberFromText(notification?.title, notification?.message)
  if (orderNumber) {
    return `/orders/${encodeURIComponent(orderNumber)}`
  }

  if (String(notification?.notification_type || '').includes('prescription')) {
    return '/prescriptions'
  }

  if (String(notification?.notification_type || '').includes('support')) {
    return '/support'
  }

  return ''
}

export function getCustomerNotificationMessage(notification, isBangla = false) {
  const rawMessage = cleanEnglishMessage(String(notification?.message || ''))
  const supportSubject = supportSubjectFromText(notification)
  const orderNumber = orderNumberFromText(notification?.title, rawMessage)

  if (String(notification?.notification_type || '') === 'support_reply') {
    if (isBangla) {
      return supportSubject
        ? `আপনার '${supportSubject}' সাপোর্ট টিকিটে নতুন রিপ্লাই এসেছে।`
        : 'আপনার সাপোর্ট টিকিটে নতুন রিপ্লাই এসেছে।'
    }

    return supportSubject
      ? `You received a new reply on your support ticket: ${supportSubject}.`
      : 'You received a new reply on your support ticket.'
  }

  if (isBangla && orderNumber) {
    if (/payment for .* has been verified/i.test(rawMessage)) {
      return `আপনার ${orderNumber} অর্ডারের পেমেন্ট যাচাই হয়েছে।`
    }

    const paymentStatus = rawMessage.match(/payment status is now ([a-z_]+)/i)?.[1]
    if (paymentStatus) {
      return `আপনার ${orderNumber} অর্ডারের পেমেন্ট স্ট্যাটাস এখন ${labelStatus(paymentStatus)}।`
    }

    const orderStatus = rawMessage.match(/order .* is now ([a-z_]+)/i)?.[1]
    if (orderStatus) {
      return `আপনার ${orderNumber} অর্ডার এখন ${labelStatus(orderStatus)}।`
    }

    if (/has been confirmed/i.test(rawMessage)) {
      return `আপনার ${orderNumber} অর্ডার কনফার্ম হয়েছে।`
    }

    if (/has been cancelled/i.test(rawMessage)) {
      return `আপনার ${orderNumber} অর্ডার বাতিল হয়েছে।`
    }

    if (/waiting for confirmation/i.test(rawMessage)) {
      return `আপনার ${orderNumber} অর্ডার কনফার্মেশনের অপেক্ষায় আছে।`
    }
  }

  return rawMessage
}
