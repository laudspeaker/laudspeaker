import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PosthogEventDocument = PosthogEvent & Document;

@Schema({ strict: false })
export class PosthogEvent {
  @Prop()
  name: string;

  @Prop()
  type: string;

  @Prop()
  payload: string;

  @Prop()
  ownerId: string;

  @Prop()
  errorMessage?: string;
}

export const PosthogEventSchema = SchemaFactory.createForClass(PosthogEvent);
