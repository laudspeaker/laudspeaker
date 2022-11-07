import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ strict: false })
export class Customer {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  audiences: string[];

  @Prop()
  ownerId: string;

  @Prop()
  externalId: string;

  @Prop()
  posthogId: string[];

  @Prop()
  phPhoneNumber: string;

  @Prop()
  phEmail: string;

  @Prop()
  phCustom: string;

  @Prop()
  phCreatedAt: Date;

  @Prop()
  phInitialOs: string;

  // @Prop()
  // phGeoIpTimeZone: string;

  // @Prop()
  // phGeoIp: {
  //   type: {
  //     type: String,
  //     default: 'Point',
  //   },
  //   coordinates: {
  //     type: [Number],
  //     default: undefined,
  //     required: true
  //   },
  //   index: '2dsphere'
  // };

  // @Prop()
  // phInitialGeoIp:{
  //   type: {
  //     type: String,
  //     default: 'Point',
  //   },
  //   coordinates: {
  //     type: [Number],
  //     default: undefined,
  //     required: true
  //   },
  //   index: '2dsphere'
  // }

  //phGeoip_latitude
  //phGeoip_longitude
  //phInitial_geoip_latitude
  //phInitial_geoip_longitude

  // @Prop()
  // posthogEmail: string;

  @Prop()
  rudderId: string;

  @Prop()
  slackName: string;

  @Prop()
  slackId: string;

  @Prop()
  slackRealName: string;

  @Prop()
  slackTeamId: string[];

  @Prop()
  slackTimeZone: number;

  @Prop()
  slackEmail: string;

  @Prop()
  slackDeleted: boolean;

  @Prop()
  slackAdmin: boolean;

  @Prop()
  slackTeamMember: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
