import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CookieOptions } from 'express';
import TemporaryStore from './temporary.store';

export interface Cookie {
  id: string;
  name: string;
  value: string;
  options?: CookieOptions;
}

@Injectable()
export class CookiesService {
  private cookieTemporaryStore = new TemporaryStore<Cookie>();

  public registerCookie(cookie: Omit<Cookie, 'id'>) {
    const id = randomUUID();
    this.cookieTemporaryStore.add({ id, ...cookie });
    return id;
  }

  public getCookie(id: string) {
    const cookie = this.cookieTemporaryStore.findOne(
      (cookie) => cookie.id === id
    );

    if (!cookie) throw new NotFoundException('Cookie not found');

    return cookie;
  }
}
