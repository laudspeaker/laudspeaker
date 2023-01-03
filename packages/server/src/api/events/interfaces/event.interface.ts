/*
{
    "anonymousId": "17a0ae45c995e1-0c60456415a142-1f3a6255-1ea000-17a0ae45c9ade3",
    "channel": "s2s",
    "context": {
        "active_feature_flags": [],
        "app": {
            "name": "PostHogPlugin"
        },
        "browser": "Chrome",
        "browser_version": 103,
        "ip": "173.68.100.31",
        "library": {
            "name": "web",
            "version": "1.26.0"
        },
        "os": {
            "name": "Mac OS X"
        },
        "page": {
            "host": "www.trytachyon.com",
            "initial_referrer": "$direct",
            "initial_referring_domain": "$direct",
            "path": "/",
            "referrer": "https://www.trytachyon.com/quickstart",
            "referring_domain": "www.trytachyon.com",
            "url": "https://www.trytachyon.com/"
        },
        "screen": {
            "height": 1120,
            "width": 1792
        },
        "token": "RxdBl8vjdTwic7xTzoKTdbmeSC1PCzV6sw-x-FKSB-k"
    },
    "event": "$pageleave",
    "messageId": "786c52ef-f7cf-48f0-a906-9da9f454ecdc",
    "originalTimestamp": "2022-07-27T23:00:13.958Z",
    "properties": {
        "distinct_id": "17a0ae45c995e1-0c60456415a142-1f3a6255-1ea000-17a0ae45c9ade3",
        "token": "RxdBl8vjdTwic7xTzoKTdbmeSC1PCzV6sw-x-FKSB-k"
    },
    "rudderId": "4eaba8fc-b6fb-4de5-b84c-4bd12c9c8424",
    "type": "track",
    "userId": "17a0ae45c995e1-0c60456415a142-1f3a6255-1ea000-17a0ae45c9ade3"
}
*/
interface Context {
  [key: string]: any;
}
interface Integrations {
  [key: string]: any;
}
interface Properties {
  [key: string]: any;
}
export interface EventsTable {
  anonymousId: string;
  userId: string;
  channel: string;
  context: string;
  event: string;
  _type: Eventtype;
  integrations?: Integrations;
  messageId: string;
  properties: Properties;
  originalTimestamp: Date;
  sentAt: Date;
}

/*
 * Can change as needed
 */

export interface CustomEventTable {
  slackId: string;
  event: string;
}

/*
 * can change this as needed
 *
 * We may need to add a payloa param in the future if we need some payload information to be used in the workflow
 *
 */
export interface SpecifiedEventTable {
  correlationKey: string;
  correlationValue: string;
  event: string;
}

export enum Channel {
  mobile,
  web,
  server,
}

export enum Eventtype {
  identify,
  page,
  screen,
  track,
  group,
  alias,
}

export enum JobTypes {
  email = 'email',
  slack = 'slack',
  sms = 'sms',
}
