import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerKeysDocument = CustomerKeys & Document;

@Schema()
export class CustomerKeys {
  @Prop()
  key: string;

  @Prop()
  type: 'String' | 'Number' | 'Boolean' | 'Email';

  @Prop()
  isArray: boolean;
}

export const CustomerKeysSchema = SchemaFactory.createForClass(CustomerKeys);
