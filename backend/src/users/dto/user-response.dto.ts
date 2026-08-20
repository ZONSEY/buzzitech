import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false })
  telephone?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({
    enum: UserRole,
  })
  role!: UserRole;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
