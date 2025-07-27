import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { isDisposableEmail } from '../utils/email.util';
import { SubscribeService } from './subscribe.service';

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly subscribeService: SubscribeService) {}

  @Post()
  async subscribe(@Body('email') email: string) {
    if (isDisposableEmail(email)) {
      throw new BadRequestException(
        'Disposable email addresses are not allowed.',
      );
    }

    const result = await this.subscribeService.handleSubscription(email);
    return { success: true, message: result };
  }
}
