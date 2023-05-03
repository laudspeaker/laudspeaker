import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { Verification } from '../auth/entities/verification.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Template } from '../templates/entities/template.entity';
import { Job } from '../jobs/entities/job.entity';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { Integration } from '../integrations/entities/integration.entity';
import { Database } from '../integrations/entities/database.entity';
import { Recovery } from '../auth/entities/recovery.entity';
import { Segment } from '../segments/entities/segment.entity';
import { Filter } from '../filter/entities/filter.entity';
import { ModalEvent } from '../modals/entities/modal-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Job,
      Segment,
      Installation,
      State,
      Workflow,
      Template,
      Audience,
      Verification,
      Integration,
      Database,
      Recovery,
      Filter,
      ModalEvent,
    ]),
  ],
})
export class DBModule {}
