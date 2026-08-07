import { EntityWithComputedFields } from '../../common/entities/entityWithComputedFields.entity';

export class EntityComputedFieldsHelper {
  public static processCollection<T>(
    collection: { entities: any[]; raw: any[] },
    computedFieldNames: string[]
  ): EntityWithComputedFields<T>[] {
    const result: EntityWithComputedFields<T>[] = [];

    for (var i = 0; i < collection.entities.length; i++) {
      const entity = collection.entities[i];
      const raw = collection.raw[i];

      const record = new EntityWithComputedFields(entity);

      for (const field of computedFieldNames) {
        // use value from entity object if it exists, otherwise use raw value
        if (entity.hasOwnProperty(field) && !raw.hasOwnProperty(field))
          record.computed[field] = entity[field];
        else record.computed[field] = raw[field];
      }

      result.push(record);
    }

    return result;
  }
}
