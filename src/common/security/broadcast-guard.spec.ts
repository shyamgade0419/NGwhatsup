import { ForbiddenException } from '@nestjs/common';
import {
  assertBroadcastSendingAllowed,
  BROADCAST_SENDING_DISABLED_CODE,
  isBroadcastSendingDisabled,
} from './broadcast-guard';
import { BulkMessageService } from '../../modules/message/bulk-message.service';
import { StatusService } from '../../modules/status/status.service';

describe('DISABLE_BROADCAST_SENDING', () => {
  const original = process.env.DISABLE_BROADCAST_SENDING;
  afterEach(() => {
    if (original === undefined) delete process.env.DISABLE_BROADCAST_SENDING;
    else process.env.DISABLE_BROADCAST_SENDING = original;
  });

  it('is off unless the value is exactly "true"', () => {
    delete process.env.DISABLE_BROADCAST_SENDING;
    expect(isBroadcastSendingDisabled()).toBe(false);
    for (const value of ['false', '', 'True', '1', 'yes']) {
      process.env.DISABLE_BROADCAST_SENDING = value;
      expect(isBroadcastSendingDisabled()).toBe(false);
    }
    process.env.DISABLE_BROADCAST_SENDING = 'true';
    expect(isBroadcastSendingDisabled()).toBe(true);
  });

  it('does nothing while the flag is off', () => {
    delete process.env.DISABLE_BROADCAST_SENDING;
    expect(() => assertBroadcastSendingAllowed('Bulk sending')).not.toThrow();
  });

  it('refuses with a 403 and a stable code when the flag is on', () => {
    process.env.DISABLE_BROADCAST_SENDING = 'true';
    try {
      assertBroadcastSendingAllowed('Bulk sending');
      throw new Error('expected a refusal');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      const body = (error as ForbiddenException).getResponse() as { code: string; message: string };
      expect(body.code).toBe(BROADCAST_SENDING_DISABLED_CODE);
      expect(body.message).toContain('Bulk sending is disabled');
    }
  });

  // The guard runs before the session lookup, the moderation gate or any database write, so a
  // blocked request does no work at all. A bare prototype proves nothing else was needed.
  it('blocks send-bulk before any other work', async () => {
    process.env.DISABLE_BROADCAST_SENDING = 'true';
    const service = Object.create(BulkMessageService.prototype) as BulkMessageService;
    await expect(
      service.createBatch('s1', { messages: [{ chatId: 'c@c.us', type: 'text', content: { text: 'x' } }] } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each(['postTextStatus', 'postImageStatus', 'postVideoStatus', 'postVoiceStatus'] as const)(
    'blocks %s before any other work',
    async method => {
      process.env.DISABLE_BROADCAST_SENDING = 'true';
      const service = Object.create(StatusService.prototype) as StatusService;
      const calls = {
        postTextStatus: () => service.postTextStatus('s1', 'text', { recipients: [] }),
        postImageStatus: () => service.postImageStatus('s1', undefined, { recipients: [] }),
        postVideoStatus: () => service.postVideoStatus('s1', undefined, { recipients: [] }),
        postVoiceStatus: () => service.postVoiceStatus('s1', undefined, { recipients: [] }),
      };
      await expect(calls[method]()).rejects.toBeInstanceOf(ForbiddenException);
    },
  );
});
