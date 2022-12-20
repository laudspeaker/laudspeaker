import { Eventtype } from '@/api/events/dto/posthog-event.dto';

export interface WorkflowTick {
  workflowId: string;
  jobIds: (string | number)[];
  status: string;
  failureReason: string;
}

export interface PosthogKeysPayload {
  type?: Eventtype;
  event?: any;
}
//   device_type?: string;
//   ce_version?: number;
//   device_id?: string;
//   current_url?: string;
//   event_type?: string;
//   geoip_city_name?: string;
//   geoip_continent_code?: string;
//   geoip_continent_name?: string;
//   browser?: string;
//   browser_version?: number;
//   geoip_latitude?: number;
//   geoip_longitude?: number;
//   geoip_postal_code?: number;
//   geoip_subdivision_1_code?: number;
//   geoip_subdivision_1_name?: string;
//   geoip_time_zone?: string;
//   insert_id?: string;
//   host?: string;
//   ip?: string;
//   lib_version?: string;
//   pathname?: string;
//   referrer?: string;
//   referring_domain?: string;
//   screen_height?: number;
//   screen_width?: number;
//   session_id?: string;
//   geoip_country_code?: string;
//   viewport_height?: number;
//   token?: string;
//   window_id?: string;
//   viewport_width?: number;
//   geoip_country_name?: string;
//   time?: Date;
//   [key: string]: any;
// }
