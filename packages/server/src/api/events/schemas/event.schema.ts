import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ strict: false })
export class Event {
  @Prop()
  ownerId: string;

  @Prop({ type: 'object' })
  event: Record<string, any>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
