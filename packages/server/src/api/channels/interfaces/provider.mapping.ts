import { MailgunProvider } from "../email/providers/mailgun.provider";
import { ResendProvider } from "../email/providers/resend.provider";
import { MailkiteProvider } from "../email/providers/mailkite.provider";

export const providerMapping = {
  mailgun: MailgunProvider,
  resend: ResendProvider,
  mailkite: MailkiteProvider,
};
