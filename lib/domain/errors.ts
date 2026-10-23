export const DOMAIN_ERROR_CODES = [
  'UNAUTHENTICATED',
  'BAD_CREDENTIALS',
  'EMAIL_TAKEN',
  'FORBIDDEN',
  'NOT_FOUND',
  'EVENT_FULL',
  'EVENT_CLOSED',
  'CONFLICT',
  'VALIDATION_ERROR',
  'BAD_PHOTO',
  'RATE_LIMITED',
  'INTERNAL',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

/** An expected, user-explainable failure. Never carries stack traces or other people's data to the client. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly detail?: string;

  constructor(code: DomainErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'DomainError';
    this.code = code;
    this.detail = detail;
  }
}

/** Friendly English messages shown in forms. */
export const ERROR_MESSAGES: Record<DomainErrorCode, string> = {
  UNAUTHENTICATED: 'Please log in first.',
  BAD_CREDENTIALS: 'That email and password don’t match an account.',
  EMAIL_TAKEN: 'An account with that email already exists. Try logging in.',
  FORBIDDEN: 'You don’t have permission to do that.',
  NOT_FOUND: 'We couldn’t find that.',
  EVENT_FULL: 'Sorry, all spots have just been taken.',
  EVENT_CLOSED: 'This has already ended or been cancelled.',
  CONFLICT: 'Something changed in the meantime. Refresh and try again.',
  VALIDATION_ERROR: 'Please check the details and try again.',
  BAD_PHOTO: 'Please choose a JPEG, PNG or WebP photo under 5 MB.',
  RATE_LIMITED: 'Too many tries. Please wait a moment and try again.',
  INTERNAL: 'Something went wrong on our side. Please try again.',
};

/** Normalises any thrown value into a client-safe code. Unknown errors are logged server-side only. */
export function toErrorCode(error: unknown): DomainErrorCode {
  if (error instanceof DomainError) return error.code;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('EVENT_FULL')) return 'EVENT_FULL';
  const pgCode = (error as { code?: string } | null)?.code;
  if (pgCode === '23505') return 'CONFLICT';
  if (pgCode === '23503' || pgCode === '22P02') return 'NOT_FOUND';
  if (pgCode === '23514') return 'VALIDATION_ERROR';
  console.error('[elmina] unexpected error', error);
  return 'INTERNAL';
}
