// Client-side security utilities for the Affiliate system

// ── Rate Limiting (in-memory, per session) ──────────────────────────────────
const rateLimitStore = {};

/**
 * Returns true if the action is allowed, false if rate-limited.
 * key: unique identifier (e.g. "signup", "login")
 * limit: max attempts
 * windowMs: rolling window in milliseconds
 */
export function checkRateLimit(key, limit = 3, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimitStore[key]) rateLimitStore[key] = [];
  // purge expired timestamps
  rateLimitStore[key] = rateLimitStore[key].filter(t => now - t < windowMs);
  if (rateLimitStore[key].length >= limit) return false;
  rateLimitStore[key].push(now);
  return true;
}

// ── Input Sanitization ───────────────────────────────────────────────────────
/** Strip HTML tags, script injections, and SQL-like patterns */
export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")                          // strip HTML tags
    .replace(/javascript:/gi, "")                     // strip JS URIs
    .replace(/on\w+\s*=/gi, "")                       // strip inline event handlers
    .replace(/(['";])\s*(--|#|\/\*)/g, "")            // strip SQL comment openers
    .replace(/(\bDROP\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bEXEC\b)/gi, "") // strip SQL keywords
    .trim();
}

// ── Disposable Email Detection ───────────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
  "mailinator.com","guerrillamail.com","10minutemail.com","throwam.com",
  "tempmail.com","trashmail.com","yopmail.com","sharklasers.com",
  "guerrillamailblock.com","grr.la","guerrillamail.info","spam4.me",
  "dispostable.com","maildrop.cc","fakeinbox.com","mailnull.com",
  "spamgourmet.com","trashmail.at","tempr.email","discard.email",
  "spambox.us","getairmail.com","filzmail.com","throwam.com",
  "tempemail.net","dispostable.com","mailnesia.com","moakt.com"
];

export function isDisposableEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

// ── Password Validation ──────────────────────────────────────────────────────
/**
 * Validates password strength:
 * - min 8 characters
 * - at least one number
 * - at least one special character
 * Returns { valid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password || password.length < 8)
    return { valid: false, message: "Password must be at least 8 characters long." };
  if (!/\d/.test(password))
    return { valid: false, message: "Password must include at least one number." };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return { valid: false, message: "Password must include at least one special character (e.g. @, #, $)." };
  return { valid: true, message: "" };
}

// ── Phone Validation ─────────────────────────────────────────────────────────
export function validatePhone(phone) {
  const cleaned = phone.replace(/\s+/g, "");
  // Accept Nigerian formats: +234XXXXXXXXXX or 0XXXXXXXXXX (10-11 digits after prefix)
  return /^(\+234|0)[789][01]\d{8}$/.test(cleaned);
}

// ── Self-Referral Check ──────────────────────────────────────────────────────
/**
 * Returns true if the referral code belongs to the registrant themselves.
 * affiliates: array of existing affiliate records
 * email/phone: registrant's details
 * referralCode: code entered
 */
export function isSelfReferral(affiliates, email, phone, referralCode) {
  if (!referralCode) return false;
  const match = affiliates.find(a => a.referral_code === referralCode.toUpperCase());
  if (!match) return false;
  return (
    match.email?.toLowerCase() === email?.toLowerCase() ||
    match.phone?.replace(/\s+/g, "") === phone?.replace(/\s+/g, "")
  );
}