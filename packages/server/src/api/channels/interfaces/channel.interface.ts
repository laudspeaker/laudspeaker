export enum ChannelType {
    EMAIL='email',
    SLACK='slack',
    SMS='sms',
    PUSH_ANDROID='push_android',
    PUSH_IOS='push_ios',
    WEBHOOK='webhook',
    WHATSAPP='whatsapp',
    IN_APP='in_app',
}

export enum Provider {
    MAILGUN = 'mailgun',
    SENDGRID = 'sendgrid',
    TWILIO = 'twilio',
    HTTP = 'http',
    WHATSAPP_API = 'whatsapp_api',
    SLACK_API = 'slack_api',
    FIREBASE_IOS = 'firebase_ios',
    FIREBASE_ANDROID = 'firebase_android',
    RESEND = 'resend',
    MAILKITE = 'mailkite',
}