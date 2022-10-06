import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema()
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
