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
  workflows: string[];

  @Prop()
  journeys: string[];

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
  phDeviceToken: string;

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
  isFreezed?: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
