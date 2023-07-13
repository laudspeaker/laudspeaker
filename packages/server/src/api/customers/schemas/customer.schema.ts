import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ strict: false })
export class Customer {
  @Prop()
  email: string;

  @Prop()
  journeys: string[];

  @Prop()
  ownerId: string;

  @Prop()
  __posthog__id: string[];

  @Prop()
  verified: boolean;

  @Prop()
  isAnonymous?: boolean;

  @Prop()
  isFreezed?: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
