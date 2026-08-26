const TOKEN_KEY = 'sih.auth.token'

/**
 * SECURITY TRADE-OFF: the token is kept in localStorage, which is readable by
 * any script on the page and therefore vulnerable to XSS. This is accepted for
 * the hackathon build because it works with a token-in-header backend and needs
 * no cookie/CORS setup.
 *
 * For production, ask the backend team for an httpOnly, Secure, SameSite
 * cookie and delete this module — the rest of the app only touches it through
 * apiClient and useAuth.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY)
    } catch {
      // Private browsing modes can throw on storage access.
      return null
    }
  },

  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Non-fatal: the session simply will not survive a refresh.
    }
  },

  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Ignore.
    }
  },
}
