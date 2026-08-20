import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';

describe('UsersController', () => {
  let controller: UsersController;
  let cloudinaryService: Partial<CloudinaryService>;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    cloudinaryService = {
      uploadBuffer: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/avatar.jpg',
      }),
    };

    usersService = {
      updateAvatar: jest.fn().mockResolvedValue({
        id: 'u1',
        avatar: 'https://res.cloudinary.com/test/avatar.jpg',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should upload avatar and return url', async () => {
    const fakeFile = {
      buffer: Buffer.from('a'),
      originalname: 'ava.png',
    } as Express.Multer.File;

    const res = await controller.uploadAvatar('u1', fakeFile);

    const uploadBufferMock = cloudinaryService.uploadBuffer as jest.Mock;
    const updateAvatarMock = usersService.updateAvatar as jest.Mock<
      unknown,
      [string, unknown]
    >;

    expect(uploadBufferMock.mock.calls.length).toBe(1);
    expect(updateAvatarMock.mock.calls[0][0]).toBe('u1');
    expect(res).toHaveProperty(
      'url',
      'https://res.cloudinary.com/test/avatar.jpg',
    );
  });
});
