import { Test, TestingModule } from '@nestjs/testing';
import { ProjectRequestsController } from './project-requests.controller';

describe('ProjectRequestsController', () => {
  let controller: ProjectRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectRequestsController],
    }).compile();

    controller = module.get<ProjectRequestsController>(
      ProjectRequestsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
