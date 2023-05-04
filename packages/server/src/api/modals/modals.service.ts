import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { CustomersService } from '../customers/customers.service';
import { Template, TemplateType } from '../templates/entities/template.entity';
import { ModalEvent } from './entities/modal-event.entity';
import { cleanTagsForSending } from '@/shared/utils/helpers';
import { Liquid } from 'liquidjs';
import recursivelyUpdateObject from '@/utils/recursivelyUpdateObject';

@Injectable()
export class ModalsService {
  public static readonly modalEventExpirationTime = 30 * 24 * 60 * 60 * 1000;

  private tagEngine = new Liquid();

  constructor(
    private accountsService: AccountsService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @InjectRepository(ModalEvent)
    private modalEventRepository: Repository<ModalEvent>
  ) { }

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

  public async validateModalAccess(apiKey: string, customerId: string) {
    const account = await this.accountsService.findOneByAPIKey(apiKey);
    if (!account) throw new NotFoundException('Account not found');

    const customer = await this.customersService.CustomerModel.findById(
      customerId
    );
    if (!customer) throw new NotFoundException('Customer not found');

    if (customer.ownerId !== account.id)
      throw new ForbiddenException("Customer does't belongs to account");
  }

  public async getQueuedModalObject(
    customerId: string
  ): Promise<Record<string, unknown> | undefined> {
    const customer = await this.customersService.CustomerModel.findById(
      customerId
    );
    if (!customer) throw new NotFoundException('Customer not found');

    const modalEvent = await this.modalEventRepository.findOne({
      where: { customerId },
      relations: ['template'],
    });
    if (!modalEvent) return;

    const modalState = modalEvent.template.modalState;
    const { _id, ownerId, workflows, ...tags } = customer.toObject();
    const filteredTags = cleanTagsForSending(tags);

    recursivelyUpdateObject(modalState, (item, type) => {
      if (type !== 'string') return item;

      return this.tagEngine.parseAndRenderSync(
        item as string,
        filteredTags || {}
      );
    });

    await this.modalEventRepository.delete({ customerId });

    return modalState;
  }

  public async deleteExpiredModalEvents() {
    await this.modalEventRepository
      .createQueryBuilder()
      .where(`now() > modal_event."expiresAt"::TIMESTAMP`)
      .delete()
      .execute();
  }
}
