import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ strict: false })
export class Customer {
  @Prop([String])
  __sys__journeys: string[];

  @Prop()
  __sys__ownerID: string;

  @Prop()
  __sys__laudspeakerID: string;

  @Prop()
  __sys__isVerified?: boolean;

  @Prop()
  __sys__isAnonymous?: boolean;

  @Prop()
  __sys__isFrozen?: boolean;

  @Prop(raw({}))
  __sys__customComponents?: Record<string, any>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
