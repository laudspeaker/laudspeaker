import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventKeysDocument = EventKeys & Document;

@Schema()
export class EventKeys {
  @Prop()
  key: string;

  @Prop()
  type: 'String' | 'Number' | 'Boolean' | 'Email';

  @Prop()
  providerSpecific: string;

  @Prop()
  isArray: boolean;
}

export const EventKeysSchema = SchemaFactory.createForClass(EventKeys);
