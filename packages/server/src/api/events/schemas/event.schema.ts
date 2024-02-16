import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ strict: false })
export class Event {
  @Prop()
  workspaceId: string;

  @Prop()
  event: string;

  @Prop({ type: Object })
  payload: Record<string, unknown>;
}

export const EventSchema = SchemaFactory.createForClass(Event);
