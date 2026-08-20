import { PartialType } from '@nestjs/swagger';
import { CreateRealisationDto } from './create-realisation.dto';

export class UpdateRealisationDto extends PartialType(CreateRealisationDto) {}
