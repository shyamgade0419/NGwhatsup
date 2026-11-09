import { ForbiddenException } from '@nestjs/common';

/**
 * NG policy: this gateway sends one-to-one transactional messages only (invoices, reminders, OTPs).
 * WhatsApp restricts numbers that look like marketing on an unofficial client, so every route that
 * fans one request out to many people is switchable off with DISABLE_BROADCAST_SENDING=true:
 *   - POST /sessions/:id/messages/send-bulk (async batch to many chats)
 *   - POST /sessions/:id/status/send-* (a status post is shown to all of the account's contacts)
 *
 * Read with `=== 'true'` on purpose, and registered as a strict boolean in env.validation.ts, so a
 * typo refuses to boot rather than silently leaving broadcasting on.
 */
export const BROADCAST_SENDING_DISABLED_CODE = 'BROADCAST_SENDING_DISABLED';

export function isBroadcastSendingDisabled(): boolean {
  return process.env.DISABLE_BROADCAST_SENDING === 'true';
}

export function assertBroadcastSendingAllowed(what: string): void {
  if (!isBroadcastSendingDisabled()) return;
  throw new ForbiddenException({
    statusCode: 403,
    code: BROADCAST_SENDING_DISABLED_CODE,
    message: `${what} is disabled on this gateway: it sends one-to-one invoices, reminders and OTPs only. Send each message with the single-send endpoints.`,
  });
}
