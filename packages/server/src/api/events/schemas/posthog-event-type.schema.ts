import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PosthogEventTypeDocument = PosthogEventType & Document;

@Schema()
export class PosthogEventType {
  @Prop()
  name: string;

  @Prop()
  displayName: string;

  @Prop()
  type: string;

  @Prop()
  event: string;

  @Prop()
  isDefault?: boolean;

  @Prop()
  ownerId: string;
}

export const PosthogEventTypeSchema =
  SchemaFactory.createForClass(PosthogEventType);
