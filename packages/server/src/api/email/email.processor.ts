import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import Mailgun from 'mailgun.js';
import { Injectable } from '@nestjs/common';
import FormData from 'form-data';

@Processor('email')
@Injectable()
export class EmailProcessor {
  @Process('send')
  async handleSend(job: Job) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: job.data.key });

    mg.messages
      .create(job.data.domain, {
        from: `${job.data.from} <${job.data.email}@${job.data.domain}>`,
        to: job.data.to,
        subject: job.data.subject,
        text: job.data.text,
      })
      .then((msg) => console.log(msg)) // logs response data
      .catch((err) => console.error(err)); // logs any error
  }
}
