import { instanceToPlain, plainToClass } from 'class-transformer';
import {
  ClassConstructor,
  ClassTransformOptions,
} from 'class-transformer/types/interfaces';
import { Types } from 'mongoose';

export function transformToObject<T, R>(
  item: T,
  type: ClassConstructor<R>,
  options: ClassTransformOptions = { strategy: 'excludeAll' }
): Record<string, any> {
  const objectTransformed = plainToClass(type, item, {
    strategy: 'exposeAll',
  });

  return instanceToPlain(objectTransformed, options);
}
