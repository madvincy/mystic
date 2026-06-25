// src/lib/utils/mpesa.ts
export const validateMpesaPhone = (phone: string): string => {
  // Remove any spaces, dashes, plus signs, or parentheses
  const cleaned = phone.replace(/[\s\-+()]/g, '')
  
  // Check if it's a valid Kenyan phone number
  // Format: 0712345678 (10 digits starting with 07)
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return `254${cleaned.slice(1)}` // Convert to 254712345678
  }
  
  // Format: 254712345678 (12 digits starting with 254)
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned
  }
  
  // Format: 712345678 (9 digits starting with 7)
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `254${cleaned}`
  }
  
  // Format: 254-712-345-678 or similar (with dashes already removed)
  if (cleaned.length === 12 && cleaned.startsWith('2547')) {
    return cleaned
  }
  
  throw new Error('Invalid phone number format. Use 0712345678, 254712345678, or 712345678')
}

// ✅ Also export a helper to format phone for display
export const formatMpesaPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-+()]/g, '')
  
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return `0${cleaned.slice(3)}` // Convert 254712345678 to 0712345678
  }
  
  return cleaned
}

// ✅ Export a helper to check if phone is valid
export const isValidMpesaPhone = (phone: string): boolean => {
  try {
    validateMpesaPhone(phone)
    return true
  } catch {
    return false
  }
}