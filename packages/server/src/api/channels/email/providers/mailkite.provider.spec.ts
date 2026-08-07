import crypto from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import { MailkiteProvider } from './mailkite.provider';
import { ClickHouseEventProvider } from '../../../../common/services/clickhouse';
import { MailkiteCredentials, MailkiteProviderData, MailkiteSendingData } from '../types/mailkite.data';

// Mirror the provider's replay-window constant (the provider value is private).
const SIGNATURE_TOLERANCE_SECONDS = 300;

// MailKite's tracking webhook signature scheme: x-mailkite-signature: t=<ms>,v1=<hex>
// where v1 = HMAC-SHA256(secret, `${t}.${body}`). Replicated here to build valid headers.
function sign(secret: string, tsMs: number, body: string): string {
  const v1 = crypto.createHmac('sha256', secret).update(`${tsMs}.${body}`).digest('hex');
  return `t=${tsMs},v1=${v1}`;
}

describe('MailkiteProvider', () => {
  let provider: MailkiteProvider;
  const credentials: MailkiteCredentials = { apiKey: 'mk_live_test', signingSecret: 'whsec_test' };
  // The EmailProvider methods take Credentials<T> = { credentials: T, metadata? }.
  const creds = { credentials };

  const originalFetch = global.fetch;

  beforeEach(() => {
    provider = new MailkiteProvider();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetchJson(response: unknown, ok = true, status = 200): jest.Mock {
    const fake = jest.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(response),
    }) as unknown as jest.Mock;
    global.fetch = fake as unknown as typeof fetch;
    return fake;
  }

  const sendingData = {
    data: {
      domain: 'app.example.com',
      local_part: 'hello',
      from_name: 'Laudspeaker',
      to: 'customer@example.org',
      subject: 'Welcome',
      html: '<p>Hi</p>',
      text: 'Hi',
      cc: ['cc@example.org'],
    } as MailkiteSendingData,
    metadata: { stepID: 'step_1', customerID: 'cust_1', templateID: 'tpl_1', workspaceID: 'ws_1' },
  };

  describe('send', () => {
    it('POSTs to /v1/send with a bearer key, composed from-address, and the workflow context as headers', async () => {
      const fake = mockFetchJson({ id: 'msg_abc', status: 'sent' });

      const [record] = await provider.send(creds, sendingData as any);

      expect(fake).toHaveBeenCalledTimes(1);
      const [url, init] = fake.mock.calls[0];
      expect(url).toBe('https://api.mailkite.dev/v1/send');
      expect((init as any).method).toBe('POST');
      expect((init as any).headers.authorization).toBe('Bearer mk_live_test');
      const body = JSON.parse((init as any).body);
      expect(body.from).toBe('Laudspeaker <hello@app.example.com>');
      expect(body.to).toBe('customer@example.org');
      expect(body.subject).toBe('Welcome');
      expect(body.html).toBe('<p>Hi</p>');
      expect(body.cc).toEqual(['cc@example.org']);
      expect(body.headers['X-Laudspeaker-Step-Id']).toBe('step_1');
      expect(body.headers['X-Laudspeaker-Workspace-Id']).toBe('ws_1');

      expect(record.event).toBe('sent');
      expect(record.messageId).toBe('msg_abc');
      expect(record.eventProvider).toBe(ClickHouseEventProvider.MAILKITE);
      expect(record.stepId).toBe('step_1');
      expect(record.customerId).toBe('cust_1');
      expect(record.workspaceId).toBe('ws_1');
      expect(record.processed).toBe(false);
    });

    it('maps a scheduled send to the "queued" event', async () => {
      mockFetchJson({ id: 'msg_sch', status: 'scheduled', scheduledAt: 123 });
      const [record] = await provider.send(creds, sendingData as any);
      expect(record.event).toBe('queued');
      expect(record.messageId).toBe('msg_sch');
    });

    it('records an error event when MailKite rejects the send', async () => {
      mockFetchJson({ error: 'domain not verified' }, false, 422);
      const [record] = await provider.send(creds, sendingData as any);
      expect(record.event).toBe('error');
      expect(record.eventProvider).toBe(ClickHouseEventProvider.MAILKITE);
    });

    it('throws on the wrong credentials type', async () => {
      await expect(
        provider.send({ credentials: { apiKey: 'only' } } as any, sendingData as any),
      ).rejects.toThrow(/Invalid credentials/);
    });
  });

  describe('fetch', () => {
    it('lists only verified domains', async () => {
      mockFetchJson([
        { domain: 'verified.com', status: 'verified' },
        { domain: 'pending.com', status: 'pending' },
        { domain: 'also.com', status: 'verified' },
      ]);
      const result = await provider.fetch<MailkiteCredentials, MailkiteProviderData>(creds);
      expect(result.data.domains).toEqual(['verified.com', 'also.com']);

      const fake = global.fetch as unknown as jest.Mock;
      expect(fake.mock.calls[0][0]).toBe('https://api.mailkite.dev/api/domains');
      expect((fake.mock.calls[0][1] as any).headers.authorization).toBe('Bearer mk_live_test');
    });

    it('throws when the domains endpoint errors', async () => {
      mockFetchJson({}, false, 500);
      await expect(provider.fetch(creds)).rejects.toThrow(/domain list failed/);
    });
  });

  describe('handle', () => {
    const eventBody = JSON.stringify({
      id: 'evt_1',
      type: 'email.sent',
      createdAt: Date.now(),
      data: { messageId: 'msg_abc', to: 'customer@example.org' },
    });

    it('verifies a valid signature and maps the event onto a ClickHouseMessage', async () => {
      const header = sign(credentials.signingSecret, Date.now(), eventBody);
      const [record] = await provider.handle(creds, {
        data: { request: { rawBody: Buffer.from(eventBody), headers: { 'x-mailkite-signature': header } } },
      } as any);

      expect(record.event).toBe('sent');
      expect(record.messageId).toBe('msg_abc');
      expect(record.eventProvider).toBe(ClickHouseEventProvider.MAILKITE);
      expect(record.processed).toBe(false);
    });

    it('rejects a tampered body with ForbiddenException', async () => {
      const header = sign(credentials.signingSecret, Date.now(), eventBody);
      const tampered = eventBody.replace('msg_abc', 'msg_xxx');
      await expect(
        provider.handle(creds, {
          data: { request: { rawBody: Buffer.from(tampered), headers: { 'x-mailkite-signature': header } } },
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a stale (replayed) timestamp', async () => {
      const staleMs = Date.now() - (SIGNATURE_TOLERANCE_SECONDS + 60) * 1000;
      const header = sign(credentials.signingSecret, staleMs, eventBody);
      await expect(
        provider.handle(creds, {
          data: { request: { rawBody: Buffer.from(eventBody), headers: { 'x-mailkite-signature': header } } },
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('maps engagement events by stripping the email. prefix', async () => {
      const clicked = JSON.stringify({
        id: 'evt_2',
        type: 'email.clicked',
        createdAt: Date.now(),
        data: { messageId: 'msg_abc', to: 'customer@example.org' },
      });
      const header = sign(credentials.signingSecret, Date.now(), clicked);
      const [record] = await provider.handle(creds, {
        data: { request: { rawBody: Buffer.from(clicked), headers: { 'x-mailkite-signature': header } } },
      } as any);
      expect(record.event).toBe('clicked');
    });
  });

  describe('setup / remove', () => {
    it('setup and remove are no-ops that resolve', async () => {
      await expect(provider.setup(creds, {} as any)).resolves.toBeUndefined();
      await expect(provider.remove(creds)).resolves.toBeUndefined();
    });
  });
});
