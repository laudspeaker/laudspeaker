import { EmailProvider } from '../interfaces/email.provider';
import { EmailCallbackData, EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData } from '../interfaces/email.data';
import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { ClickHouseEventProvider } from '../../../../common/services/clickhouse';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';
import { MailkiteCallbackData, MailkiteCredentials, MailkiteSendingData } from '../types/mailkite.data';
import crypto from 'crypto';

// MailKite public API. Overrideable in tests via (global as any).MAILKITE_API_BASE.
const MAILKITE_API_BASE = (global as any).MAILKITE_API_BASE ?? 'https://api.mailkite.dev';

// Replay-window tolerance for the x-mailkite-signature timestamp, in seconds. Matches the
// MailKite platform's own verifiers. The header carries `t` as a millisecond epoch.
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * MailKite email channel provider.
 *
 * MailKite (https://mailkite.dev) is a developer email platform: send transactional mail via
 * `POST /v1/send` and receive inbound mail as a signed webhook. This provider implements the
 * Laudspeaker `EmailProvider` contract the same way `ResendProvider` / `MailgunProvider` do:
 *
 *  - `fetch()`  lists the account's send-ready (verified) domains via `GET /api/domains`.
 *  - `send()`   sends one message via `POST /v1/send`, tagging it with the workflow context
 *               as custom headers for traceability, and records the returned MailKite message id.
 *  - `setup()`  is a no-op — the tracking webhook URL + signing secret are configured in the
 *               MailKite dashboard and stored as the channel credential (same shape as Resend).
 *  - `handle()` verifies the `x-mailkite-signature: t=<ms>,v1=<hex>` header (HMAC-SHA256 over
 *               `${t}.${rawBody}` with the signing secret, ±300s replay window) and maps the
 *               signed tracking event onto a ClickHouseMessage.
 *  - `remove()` is a no-op — the webhook survives channel removal and is managed from MailKite.
 *
 * Note on event correlation: MailKite's tracking webhook (like the wider `{ id, type, data }`
 * convention it follows) keys events by `messageId` and recipient rather than echoing
 * Laudspeaker's workflow tags back the way Resend does. `send()` therefore records the MailKite
 * message id, and `handle()` surfaces it; fully correlating an engagement event back to its
 * step/customer/template/workspace needs a send-time `messageId → context` lookup on
 * Laudspeaker's side (the webhook HTTP route + that store are intentionally out of scope for
 * this provider file).
 */
@Injectable()
export class MailkiteProvider implements EmailProvider {
  private isMailkiteCredentials(credentials: EmailCredentials): credentials is MailkiteCredentials {
    return (
      (credentials as MailkiteCredentials).apiKey !== undefined &&
      (credentials as MailkiteCredentials).signingSecret !== undefined
    );
  }

  private isMailkiteSendingData(data: EmailSendingData): data is MailkiteSendingData {
    const d = data as MailkiteSendingData;
    return (
      d.domain !== undefined &&
      d.to !== undefined &&
      d.from_name !== undefined &&
      d.subject !== undefined &&
      d.html !== undefined &&
      d.local_part !== undefined
    );
  }

  private isMailkiteCallbackData(data: EmailCallbackData): data is MailkiteCallbackData {
    return (data as MailkiteCallbackData).request !== undefined;
  }

  async fetch<T extends EmailCredentials, U extends EmailProviderData>(creds: Credentials<T>): Promise<ProviderData<U>> {
    const { credentials } = creds;

    if (this.isMailkiteCredentials(credentials)) {
      const res = await fetch(`${MAILKITE_API_BASE}/api/domains`, {
        method: 'GET',
        headers: { authorization: `Bearer ${credentials.apiKey}`, 'content-type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`MailKite domain list failed: HTTP ${res.status}`);
      }
      const domains: any[] = await res.json();
      // A domain is send-ready once MailKite marks it verified (SPF + DKIM accepted).
      const verified = domains.filter((d) => d && d.status === 'verified').map((d) => d.domain) as unknown as string[];
      return { data: { domains: verified } as unknown as U };
    }
    throw new Error('Invalid credentials type for MailkiteProvider');
  }

  async send<T extends EmailCredentials, U extends EmailSendingData>(creds: Credentials<T>, sendingData: SendingData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = sendingData;
    const { credentials } = creds;

    const record: ClickHouseMessage = {
      createdAt: new Date(),
      stepId: metadata.stepID,
      customerId: metadata.customerID,
      event: undefined,
      eventProvider: ClickHouseEventProvider.MAILKITE,
      messageId: undefined,
      templateId: String(metadata.templateID),
      workspaceId: metadata.workspaceID,
      processed: false,
    };

    if (this.isMailkiteCredentials(credentials) && this.isMailkiteSendingData(data)) {
      try {
        const from = `${data.from_name} <${data.local_part}@${data.domain}>`;
        // Tag the stored message with Laudspeaker's workflow context as custom headers, so it
        // stays traceable end-to-end. (MailKite's tracking webhook keys by messageId rather than
        // echoing these headers — see the class doc and handle().)
        const headers: Record<string, string> = {
          'X-Laudspeaker-Step-Id': metadata.stepID,
          'X-Laudspeaker-Customer-Id': metadata.customerID,
          'X-Laudspeaker-Template-Id': String(metadata.templateID),
          'X-Laudspeaker-Workspace-Id': metadata.workspaceID,
        };
        const body: Record<string, unknown> = {
          from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          ...(data.text ? { text: data.text } : {}),
          ...(data.cc ? { cc: data.cc } : {}),
          ...(data.bcc ? { bcc: data.bcc } : {}),
          headers,
        };

        const res = await fetch(`${MAILKITE_API_BASE}/v1/send`, {
          method: 'POST',
          headers: { authorization: `Bearer ${credentials.apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          return [{ ...record, event: 'error', messageId: JSON.stringify(json) || `HTTP ${res.status}` }];
        }
        // MailKite returns status "scheduled" for send-later messages; map that to "queued".
        const event = json.status === 'scheduled' ? 'queued' : 'sent';
        return [{ ...record, event, messageId: json.id ?? '' }];
      } catch (err) {
        return [{ ...record, event: 'error', messageId: (err as Error).stack }];
      }
    }
    throw new Error('Invalid credentials or sending data type for MailkiteProvider');
  }

  async setup<T extends EmailCredentials, U extends EmailSetupData>(creds: Credentials<T>, data: SetupData<U>): Promise<void> {
    // No API-side setup is required from the provider. The MailKite tracking webhook URL
    // (pointing back at this service) and the signing secret are configured from the MailKite
    // dashboard and stored as the channel credential — the same shape Resend uses.
  }

  async handle<T extends EmailCredentials, U extends EmailCallbackData>(creds: Credentials<T>, callbackData: CallbackData<U>): Promise<ClickHouseMessage[]> {
    const { data } = callbackData;
    const { credentials } = creds;

    if (this.isMailkiteCredentials(credentials) && this.isMailkiteCallbackData(data)) {
      const raw = data.request.rawBody?.toString('utf8') ?? '';
      const header = (data.request.headers as any)['x-mailkite-signature'] ?? '';

      const event = this.verifyAndParse(credentials.signingSecret, header, raw);
      if (!event) {
        throw new ForbiddenException('Invalid signature on MailKite callback event');
      }

      // MailKite tracking events use the { id, type: "email.<event>", createdAt, data } envelope
      // (the same convention Resend follows), but carry messageId + recipient rather than
      // Laudspeaker's workflow tags. The ClickHouseMessage workflow fields therefore stay empty
      // here and are filled by the send-time messageId→context lookup on the route side.
      return [{
        workspaceId: '',
        stepId: undefined,
        customerId: '',
        templateId: '',
        messageId: event.data?.messageId ?? event.id ?? '',
        event: String(event.type ?? '').replace('email.', ''),
        eventProvider: ClickHouseEventProvider.MAILKITE,
        processed: false,
        createdAt: new Date(event.createdAt ?? Date.now()),
      }];
    }
    throw new Error('Invalid credentials or callback data type for MailkiteProvider');
  }

  async remove<T extends EmailCredentials>(creds: Credentials<T>): Promise<void> {
    // Nothing to tear down on MailKite's side — the tracking webhook is managed from the
    // MailKite dashboard and intentionally survives channel removal.
  }

  // ---- MailKite webhook verification -----------------------------------------
  // Verifies `x-mailkite-signature: t=<ms>,v1=<hex>`, where v1 is the lowercase-hex
  // HMAC-SHA256 of `${t}.${rawBody}` keyed by the account signing secret, within a ±300s
  // replay window (t is a ms epoch). Returns the parsed event JSON, or null when the
  // signature is malformed, stale, or mismatched.
  private verifyAndParse(secret: string, header: string, rawBody: string): any | null {
    const parts = Object.fromEntries(
      header
        .split(',')
        .map((p) => {
          const i = p.indexOf('=');
          return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
        })
        .filter(([k]) => k),
    ) as { t?: string; v1?: string };

    const ts = Number(parts.t);
    if (!parts.t || !parts.v1 || !Number.isFinite(ts)) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    const headerSeconds = Math.floor(ts / 1000); // t is a ms epoch
    if (Math.abs(nowSeconds - headerSeconds) > SIGNATURE_TOLERANCE_SECONDS) return null;

    const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
    const given = parts.v1;
    if (expected.length !== given.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given))) {
      return null;
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return null;
    }
  }
}
