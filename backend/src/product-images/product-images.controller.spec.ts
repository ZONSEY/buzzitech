import { Test, TestingModule } from '@nestjs/testing';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { ProductsService } from 'src/products/products.service';

describe('ProductImagesController', () => {
  let controller: ProductImagesController;
  let cloudinaryService: Partial<CloudinaryService>;
  let productImagesService: Partial<ProductImagesService>;
  let productsService: Partial<ProductsService>;

  beforeEach(async () => {
    cloudinaryService = {
      uploadBuffer: jest.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
      }),
    };

    productImagesService = {
      create: jest.fn().mockResolvedValue({
        id: 'img1',
        url: 'https://res.cloudinary.com/test/image.jpg',
      }),
    };

    productsService = {
      findOne: jest.fn().mockResolvedValue({ id: 'prod1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductImagesController],
      providers: [
        { provide: ProductImagesService, useValue: productImagesService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    controller = module.get<ProductImagesController>(ProductImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uploads image and persists url', async () => {
    const fakeFile = {
      buffer: Buffer.from('test'),
      originalname: 'pic.jpg',
    } as Express.Multer.File;

    const res = await controller.upload('prod1', fakeFile);

    const uploadBufferMock = cloudinaryService.uploadBuffer as jest.Mock;
    const createMock = productImagesService.create as jest.Mock<
      unknown,
      [string, unknown]
    >;

    expect(uploadBufferMock.mock.calls.length).toBe(1);
    expect(createMock.mock.calls[0][0]).toBe('prod1');
    expect(res).toEqual({
      id: 'img1',
      url: 'https://res.cloudinary.com/test/image.jpg',
    });
  });

  it("rejette l'upload si le produit n'existe pas, sans appeler Cloudinary", async () => {
    const notFound = new Error('Produit introuvable.');
    (productsService.findOne as jest.Mock).mockRejectedValue(notFound);

    const fakeFile = {
      buffer: Buffer.from('test'),
      originalname: 'pic.jpg',
    } as Express.Multer.File;

    await expect(controller.upload('inconnu', fakeFile)).rejects.toThrow(
      notFound,
    );
    expect(cloudinaryService.uploadBuffer as jest.Mock).not.toHaveBeenCalled();
  });
});
