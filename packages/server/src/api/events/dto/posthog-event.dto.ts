import { ToDate, Trim } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
} from 'class-validator';

enum Eventtype {
  identify,
  page,
  screen,
  track,
  group,
  alias,
}

export class PostHogEventDto {
  @Trim()
  @IsNotEmpty()
  public userId: string;

  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public anonymousId: string;

  @IsString()
  @IsNotEmpty()
  public channel: string;

  @IsObject()
  @IsOptional()
  //object
  public context: any;

  @IsEnum(Eventtype)
  @IsNotEmpty()
  public type: Eventtype;

  @IsString()
  @IsOptional()
  public messageId: string;

  @IsString()
  @IsOptional()
  public phPhoneNumber: string;

  @IsString()
  @IsOptional()
  public phEmail: string;

  @IsString()
  @IsOptional()
  public phCustom: string;

  @IsString()
  @IsOptional()
  public event?: Record<string, any>;

  //object
  @IsObject()
  @IsOptional()
  public properties: any;

  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  public originalTimestamp: Date;

  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  public sentAt: Date;
}

const example = {
  batch: [
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/blog',
          path: '/blog',
          referrer:
            'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:35.580Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'page',
      properties: {
        host: 'www.trytachyon.com',
        url: 'https://www.trytachyon.com/blog',
        path: '/blog',
        referrer:
          'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
        referring_domain: 'www.trytachyon.com',
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/blog',
          path: '/blog',
          referrer:
            'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:38.728Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'track',
      event: 'click',
      properties: {
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/blog',
          path: '/blog',
          referrer:
            'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:39.172Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'track',
      event: '$pageleave',
      properties: {
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          path: '/post/how-we-built-a-new-fast-file-transfer-protocol',
          referrer: 'https://www.trytachyon.com/blog',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:39.322Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'page',
      properties: {
        host: 'www.trytachyon.com',
        url: 'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
        path: '/post/how-we-built-a-new-fast-file-transfer-protocol',
        referrer: 'https://www.trytachyon.com/blog',
        referring_domain: 'www.trytachyon.com',
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          path: '/post/how-we-built-a-new-fast-file-transfer-protocol',
          referrer: 'https://www.trytachyon.com/blog',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:44.190Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'track',
      event: 'click',
      properties: {
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          path: '/post/how-we-built-a-new-fast-file-transfer-protocol',
          referrer: 'https://www.trytachyon.com/blog',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:44.789Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'track',
      event: 'click',
      properties: {
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          path: '/post/how-we-built-a-new-fast-file-transfer-protocol',
          referrer: 'https://www.trytachyon.com/blog',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:45.460Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'track',
      event: '$pageleave',
      properties: {
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
    {
      context: {
        app: {
          name: 'PostHogPlugin',
        },
        os: {
          name: 'Mac OS X',
        },
        browser: 'Chrome',
        page: {
          host: 'www.trytachyon.com',
          url: 'https://www.trytachyon.com/blog-2/features',
          path: '/blog-2/features',
          referrer:
            'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
          referring_domain: 'www.trytachyon.com',
        },
        browser_version: 103,
        screen: {
          height: 1120,
          width: 1792,
        },
        library: {
          name: 'web',
          version: '1.26.0',
        },
        ip: '173.68.100.31',
        active_feature_flags: [],
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
      channel: 's2s',
      originalTimestamp: '2022-07-27T19:17:45.609Z',
      userId: '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      anonymousId:
        '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
      type: 'page',
      properties: {
        host: 'www.trytachyon.com',
        url: 'https://www.trytachyon.com/blog-2/features',
        path: '/blog-2/features',
        referrer:
          'https://www.trytachyon.com/post/how-we-built-a-new-fast-file-transfer-protocol',
        referring_domain: 'www.trytachyon.com',
        distinct_id:
          '18241152f7d334-0020066e0529ed-1c525635-1ea000-18241152f7ed75',
        token: 'phc_6ncsfgidK4nfUfJusEDL9V5BP90b1n4CFwOHGHgaC9p',
      },
    },
  ],
  sentAt: '2022-07-27T19:18:35.759Z',
};
