import { User } from 'generated/prisma';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone ?? undefined,
      avatar: user.avatar ?? undefined,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
