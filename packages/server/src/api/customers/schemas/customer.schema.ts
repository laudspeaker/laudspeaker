import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

export type JourneyEnrollmentsDates = Record<string, Date>;

@Schema({ strict: false })
export class Customer {

  @Prop()
  _id: string;

  @Prop()
  other_ids: string[];

  @Prop()
  createdAt: Date;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  workflows: string[];

  @Prop()
  journeys: string[];

  @Prop({
    type: Object,
    obj: {},
  })
  journeyEnrollmentsDates: JourneyEnrollmentsDates;

  @Prop()
  workspaceId: string;

  @Prop()
  externalId: string;

  @Prop()
  posthogId: string[];

  @Prop()
  phPhoneNumber: string;

  @Prop()
  phEmail: string;

  @Prop()
  phDeviceToken: string;

  @Prop()
  androidDeviceToken: string;

  @Prop()
  iosDeviceToken: string;
  
  @Prop()
  iosDeviceTokenSetAt: Date;

  @Prop()
  androidDeviceTokenSetAt: Date;

  @Prop()
  phCustom: string;

  @Prop()
  phCreatedAt: Date;

  @Prop()
  phInitialOs: string;

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

  @Prop()
  verified: boolean;

  @Prop()
  phone: string;

  @Prop()
  isAnonymous?: boolean;

  @Prop()
  device_token_android?: string;

  @Prop()
  device_token_ios?: string;

  @Prop(raw({}))
  customComponents: Record<string, any>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
