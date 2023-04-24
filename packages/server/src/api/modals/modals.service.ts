import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template, TemplateType } from '../templates/entities/template.entity';
import { ModalEvent } from './entities/modal.entity';

@Injectable()
export class ModalsService {
  public static readonly modalEventExpirationTime = 30 * 24 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(ModalEvent)
    private modalEventRepository: Repository<ModalEvent>
  ) {}

  public async queueModalEvent(customerId: string, template: Template) {
    if (template?.type !== TemplateType.MODAL)
      throw new BadRequestException(
        'Invalid template type: should be modal, got: ' + template.type
      );

    await this.modalEventRepository.save({
      template: { id: template.id },
      customerId,
      expiresAt: new Date(Date.now() + ModalsService.modalEventExpirationTime),
    });
  }

  public async getQueuedModalObject(
    customerId: string
  ): Promise<Record<string, unknown> | undefined> {
    const modalEvent = await this.modalEventRepository.findOne({
      where: { customerId },
      relations: ['template'],
    });

    if (!modalEvent) return;

    return modalEvent.template.modalState;
  }
}

