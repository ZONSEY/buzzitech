import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    example: true,
  })
  success: boolean;

  @ApiProperty({
    example: 'Opération effectuée avec succès.',
  })
  message: string;

  @ApiProperty()
  data: T;

  @ApiPropertyOptional()
  meta?: any;
}
