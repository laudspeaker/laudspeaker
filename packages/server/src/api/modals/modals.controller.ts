import { Controller } from '@nestjs/common';
import { ModalsService } from './modals.service';

@Controller('modals')
export class ModalsController {
  constructor(private modalsService: ModalsService) {}
}
