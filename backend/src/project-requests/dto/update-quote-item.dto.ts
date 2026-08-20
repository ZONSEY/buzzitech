import { PartialType } from '@nestjs/swagger';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class UpdateQuoteItemDto extends PartialType(CreateQuoteItemDto) {}
