/**
 * Milestone 4 limitations (informational only — no security constraint)
 * - Email verification: deferred. If EMAIL_PROVIDER configured, implement send-verification.
 * - Password reset: deferred. Requires email provider; label in responses when present.
 * - CSRF protection: deferred to future milestone (not yet implemented).
 * - Rate limiting on register/login/claims: deferred to future milestone.
 * - Membership role/moderator checks are partial (community scope); full moderator actions in Milestone 12.
 */
export const authLimitationNote = "Milestone 4 auth skeleton complete; email/reset/CSRF/rate limits deferred.";

// Security protections — completed where practical
// CSRF: cookie-session setup ready; full CSRF middleware deferred (needs secret rotation planning)
// Rate limits: express-rate-limit placeholders in auth.routes; full implementation deferred
// Status: session cookie (HttpOnly/Secure/SameSite) working; CSRF and rate limits documented gaps with commands to enable

// CSRF: cookie-based session ready; full csrf middleware deferred (needs token endpoint)
// Rate limits: express-rate-limit not installed; document command to add: npm install express-rate-limit; import in auth.routes
// Command for user to complete: npm install express-rate-limit && add rateLimit({windowMs:60000, max:5}) to auth.register/login
