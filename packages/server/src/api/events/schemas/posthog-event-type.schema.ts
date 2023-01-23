import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PosthogEventTypeDocument = PosthogEventType & Document;

@Schema()
export class PosthogEventType {
  @Prop()
  name: string;
}

export const PosthogEventTypeSchema =
  SchemaFactory.createForClass(PosthogEventType);
