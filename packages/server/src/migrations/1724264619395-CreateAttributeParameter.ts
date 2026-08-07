import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateAttributeParameter1724264619395 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE attribute_parameter
      (
        id                    serial,
        key                   varchar         NOT NULL,
        display_value         varchar         NOT NULL,
        example               varchar,
        attribute_type_id     serial,
        CONSTRAINT "PK_de37782d784dbddbfaee836c0d7" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(`ALTER TABLE "attribute_parameter" ADD CONSTRAINT "FK_b92459b51f429a402b2812378b0" FOREIGN KEY ("attribute_type_id") REFERENCES "attribute_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    const dateFormats = [
      { key: "dd MMM yyyy", title: "DD MMM yyyy", example: "15 Jan 1990" },
      { key: "dd MMM yy", title: "DD MMM yy", example: "15 Jan 90" },
      { key: "dd-MM-yy", title: "DD MM yy", example: "15-01-90" },
      { key: "dd-MM-yyyy", title: "DD MM yyyy", example: "15-01-1990" },
      { key: "dd-M-yy", title: "DD M yy", example: "15-1-90" },
      { key: "dd-M-yyyy", title: "DD M yyyy", example: "15-1-1990" },
      { key: "M-dd-yy", title: "M DD yy", example: "1-15-90" },
      { key: "M-dd-yyyy", title: "M DD yyyy", example: "1-15-1990" },
      { key: "MM-dd-yy", title: "MM DD yy", example: "01-15-90" },
      { key: "MM-dd-yyyy", title: "MM DD yyyy", example: "01-15-1990" },
      { key: "MMM dd yyyy", title: "MMM DD yyyy", example: "Jan 15 1990" },
      { key: "MMM dd yy", title: "MMM DD yy", example: "Jan 15 90" },
      { key: "MMMM dd yyyy", title: "Month DD yyyy", example: "January 15 1990" },
      { key: "MMMM dd yy", title: "Month DD yy", example: "January 15 90" },
      { key: "yyyy-M-dd", title: "yyyy M DD", example: "1990-1-15" },
      { key: "yyyy-MM-dd", title: "yyyy MM DD", example: "1990-01-15" },
      {
        key: "EEE, MMM dd, yyyy",
        title: "ddd MMM DD yyyy",
        example: "Mon, Jan 15, 1990",
      },
    ];

    const dateTimeFormats = [
      {
        key: "yyyy-MM-dd HH:mm",
        title: "yyyyMMDD HHmm",
        example: "1990-01-15 10:10",
      },
      {
        key: "MM-dd-yyyy HH:mm",
        title: "MMDDyyyy HHmm",
        example: "01-15-1990 10:10",
      },
      {
        key: "dd-MM-yyyy HH:mm",
        title: "DDMMyyyy HHmm",
        example: "15-01-1990 10:10",
      },
      { key: "MM-dd-yy HH:mm", title: "MMDDyy HHmm", example: "01-15-90 10:10" },
      { key: "dd-MM-yy HH:mm", title: "DDMMyy HHmm", example: "15-01-90 10:10" },
      {
        key: "MM-dd-yyyy hh:mm aaaa",
        title: "MMDDyyyy HHmm xm",
        example: "01-15-1990 10:10 pm",
      },
      {
        key: "dd-MM-yyyy hh:mm aaaa",
        title: "DDMMyyyy HHmm xm",
        example: "15-01-1990 10:10 am",
      },
      {
        key: "MM-dd-yy hh:mm:ss aaaa",
        title: "MMDDyy HHmmss xm",
        example: "01-15-90 10:10:10 am",
      },
      {
        key: "yyyy-MM-dd'T'HH:mm",
        title: "yyyyMMDDTHHmm",
        example: "1990-01-15T10:10",
      },
      {
        key: "yyyy-MM-dd'T'HH:mmxxx",
        title: "yyyyMMDDTHHmmoffset",
        example: "1990-01-15T10:10+09:30",
      },
      {
        key: "yyyy-MM-dd'T'HH:mm:ssxxx",
        title: "ISO 8601",
        example: "1990-01-15T00:34:59+09:30",
      },
      {
        key: "yyyy-MM-dd'T'HH:mm:ss",
        title: "ISO 8601 without timezone offset",
        example: "1990-01-15T00:34:59",
      },
      { key: "T", title: "Unix timestamp", example: "1670874565" },
      {
        key: "ddd MMM DD HHmmss yyyy",
        title: "ddd MMM DD HHmmss yyyy",
        example: "Wed, Jan 15, 00:34:60, 1990",
      },
    ];

    const dateRecordID = await queryRunner.query(`SELECT id from attribute_type WHERE name = 'Date' LIMIT 1`);
    const dateTimeRecordID = await queryRunner.query(`SELECT id from attribute_type WHERE name = 'DateTime' LIMIT 1`);
    let escaped_key;

    for(let format of dateFormats) {
      escaped_key = format.key.replace(/'/g, "''");

      await queryRunner.query(
        `INSERT INTO attribute_parameter 
          (key, display_value, example, attribute_type_id) VALUES
          ('${escaped_key}', '${format.title}', '${format.example}', ${dateRecordID[0].id})`
      );
    }

    for(let format of dateTimeFormats) {
      escaped_key = format.key.replace(/'/g, "''");

      await queryRunner.query(
        `INSERT INTO attribute_parameter 
          (key, display_value, example, attribute_type_id) VALUES
          ('${escaped_key}', '${format.title}', '${format.example}', ${dateTimeRecordID[0].id})`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE attribute_parameter`);
  }

}
