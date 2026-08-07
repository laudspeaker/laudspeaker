import { NotificationPreference } from '@/api/notification-preferences/entities/notification-preference.entity';
import { NotificationPreferenceService } from '@/api/notification-preferences/notification-preferences.service';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import { CacheConstants } from '@/common/services/cache.constants';
import { CacheService } from '@/common/services/cache.service';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Context, Liquid, TagToken } from 'liquidjs';
import { Repository } from 'typeorm';

interface CustomTagToken extends TagToken {
  parsedData?: string[];
}


export class LiquidInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export abstract class BaseLiquidEngineProvider extends BaseLaudspeakerService {
  protected tagEngine: Liquid;

  constructor(
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(NotificationPreferenceService)
    private readonly notificationPreferenceService: NotificationPreferenceService,
  ) {
    super();
    this.tagEngine = new Liquid();
    this.setupCustomTags();
  }

  private setupCustomTags(): void {
    this.tagEngine.registerTag('api_call', {
      parse(token) {
        this.items = token.args.split(' ');
      },
      async render(ctx) {
        const url = this.tagEngine.parseAndRenderSync(this.items[0], ctx.getAll(), ctx.opts);
        try {
          const res = await fetch(url, { method: 'GET' });

          if (res.status !== 200) throw new LiquidInvalidError('Error while processing api_call tag');

          const data = res.headers.get('Content-Type').includes('application/json')
            ? await res.json()
            : await res.text();

          if (this.items[1] === ':save' && this.items[2]) {
            ctx.push({ [this.items[2]]: data });
          }
        } catch (e) {
          throw new LiquidInvalidError('Error while processing api_call tag');
        }
      },
    });
    const parentThis = this;
    this.tagEngine.registerTag('unsubscribe', {
      parse: function (token: CustomTagToken) {
        this.defininition = token.args.split('.');
      },
      render: async function (ctx: Context) {
        const contextData = ctx.getAll();
        const customerId = contextData['customerId'];
        const workspaceId = contextData['workspaceId'];

        if (!customerId || !workspaceId) {
          throw new Error('Customer ID and workspace ID are required to generate an unsubscribe link.');
        }

        let unsubscribeUrl;

        try {
          const preferenceId = await parentThis.fetchUnsubscribeData(workspaceId, this.definition);

          if (this.definition === 'all') {
            unsubscribeUrl = `${process.env.FRONTEND_URL}/notification-preferences/${workspaceId}/${customerId}/all`;
          } else {
            unsubscribeUrl = `${process.env.FRONTEND_URL}/notification-preferences/${workspaceId}/${customerId}/${preferenceId}`;
          }
        } catch (error) {
          parentThis.error(error, `unsubscribe_render`, randomUUID())
          throw error;
        }

        return unsubscribeUrl;
      },
    });
  }

  private async fetchUnsubscribeData(workspaceId: string, definition: string) {

    const notificationPreference = await this.cacheService.getIgnoreError(
      CacheConstants.NOTIFICATION_PREFERENCES,
      `${workspaceId}:${definition}`,
      async () => {
        return await this.notificationPreferenceService.findOneByName(workspaceId, definition);
      });
    if (!notificationPreference) {
      throw new Error(`Notification preference "${definition}" not found.`);
    }

    return notificationPreference.id;
  }

  // Common method to parse templates with the Liquid engine
  protected async parseLiquid(text: string, context: any): Promise<string> {
    return await this.tagEngine.parseAndRender(text, context || {}, { strictVariables: true });
  }
}
