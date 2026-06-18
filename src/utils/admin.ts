// Admin whitelist — only these emails can access /admin
export const ADMIN_EMAILS = [
  'ompurwar96@gmail.com',
]

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
