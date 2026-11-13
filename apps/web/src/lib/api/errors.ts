import { ApiError } from './http';

/** A short, user-facing sentence for any thrown value. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong.';
}
