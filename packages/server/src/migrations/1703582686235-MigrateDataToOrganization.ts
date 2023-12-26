import { MigrationInterface, QueryRunner } from 'typeorm';

function arrayToSQL(array) {
  if (Array.isArray(array) && array.length > 0) {
    return `ARRAY[${array.map((item) => `'${item}'`).join(',')}]`;
  } else {
    return 'ARRAY[]::varchar[]';
  }
}

export class MigrateDataToOrganization1703582686235
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    try {
      const accounts = await queryRunner.query('SELECT * FROM "account"');

      for (const account of accounts) {
        const companyName = `${account.email.split('@')[0]} company`;

        const organizationResult = await queryRunner.query(
          `INSERT INTO "organization" ("companyName", "ownerId") VALUES ('${companyName}', '${account.id}') RETURNING "id"`
        );
        const organizationId = organizationResult[0].id;

        const teamResult = await queryRunner.query(
          `INSERT INTO "organization_team" ("organizationId", "teamName") VALUES ('${organizationId}', 'Default team') RETURNING "id"`
        );
        const teamId = teamResult[0].id;

        await queryRunner.query(
          `INSERT INTO "organization_team_members_account" ("organizationTeamId", "accountId") VALUES ('${teamId}', '${account.id}')`
        );

        await queryRunner.query(
          `INSERT INTO "workspaces" (
             "name", 
             "timezoneUTCOffset", 
             "apiKey", 
             "mailgunAPIKey", 
             "sendingDomain", 
             "sendingEmail", 
             "sendingName", 
             "slackTeamId", 
             "posthogApiKey", 
             "posthogProjectId", 
             "posthogHostUrl", 
             "posthogSmsKey", 
             "posthogEmailKey", 
             "posthogFirebaseDeviceTokenKey", 
             "firebaseCredentials", 
             "emailProvider", 
             "testSendingEmail", 
             "testSendingName", 
             "freeEmailsCount", 
             "sendgridApiKey", 
             "sendgridFromEmail", 
             "sendgridVerificationKey", 
             "smsAccountSid", 
             "smsAuthToken", 
             "smsFrom", 
             "posthogSetupped", 
             "javascriptSnippetSetupped", 
             "pushPlatforms", 
             "organizationId"
           ) VALUES (
             '${companyName} Workspace', 
             'UTC+00:00', 
             '${account.apiKey ?? ''}', 
             '${account.mailgunAPIKey ?? ''}', 
             '${account.sendingDomain ?? ''}', 
             '${account.sendingEmail ?? ''}', 
             '${account.sendingName ?? ''}', 
             ${arrayToSQL(account.slackTeamId)}, 
             ${arrayToSQL(account.posthogApiKey)}, 
             ${arrayToSQL(account.posthogProjectId)}, 
             ${arrayToSQL(account.posthogHostUrl)}, 
             ${arrayToSQL(account.posthogSmsKey)}, 
             ${arrayToSQL(account.posthogEmailKey)}, 
             ${arrayToSQL(account.posthogFirebaseDeviceTokenKey)}, 
             '${account.firebaseCredentials ?? ''}', 
             '${account.emailProvider ?? ''}', 
             '${account.testSendingEmail ?? ''}', 
             '${account.testSendingName ?? ''}', 
             ${account.freeEmailsCount ?? 0}, 
             '${account.sendgridApiKey ?? ''}', 
             '${account.sendgridFromEmail ?? ''}', 
             '${account.sendgridVerificationKey ?? ''}', 
             '${account.smsAccountSid ?? ''}', 
             '${account.smsAuthToken ?? ''}', 
             '${account.smsFrom ?? ''}', 
             ${account.posthogSetupped ?? false}, 
             ${account.javascriptSnippetSetupped ?? false}, 
             '${JSON.stringify(account.pushPlatforms)}', 
             '${organizationId}'
           )`
        );
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

