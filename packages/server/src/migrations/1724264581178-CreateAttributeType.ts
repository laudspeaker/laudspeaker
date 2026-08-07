import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateAttributeType1724264581178 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE attribute_type
      (
        id                    serial          primary key,
        name                  varchar         NOT NULL,
        can_be_subtype        boolean         NOT NULL      DEFAULT false,
        subtype_required      boolean         NOT NULL      DEFAULT false,
        parameters_required   boolean         NOT NULL      DEFAULT false
      )`
    );

    const types = [
      "String",
      "Number",
      "Boolean",
      "Email",
      "Date",
      "DateTime",
      "Array",
      "Object",
    ];

    for (let type of types) {
      let can_be_subtype = true;
      let subtype_required = false;
      let parameters_required = false;

      if (type )

      if (type == "Object")
        can_be_subtype = false;

      if (type == "Array")
        subtype_required = true;

      if (type == "Date" || type == "DateTime")
        parameters_required = true;

      await queryRunner.query(
        `INSERT INTO attribute_type
          (name, can_be_subtype, subtype_required, parameters_required) VALUES
          ('${type}', ${can_be_subtype}, ${subtype_required}, ${parameters_required})`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE attribute_type`);
  }

}
