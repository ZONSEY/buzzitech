import { ProjectStatus } from 'generated/prisma';

export const PROJECT_STATUS_TRANSITIONS: Record<
  ProjectStatus,
  ProjectStatus[]
> = {
  [ProjectStatus.NEW]: [ProjectStatus.ANALYSIS, ProjectStatus.CANCELLED],

  [ProjectStatus.ANALYSIS]: [ProjectStatus.APPROVED, ProjectStatus.CANCELLED],

  [ProjectStatus.APPROVED]: [
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.CANCELLED,
  ],

  [ProjectStatus.IN_PROGRESS]: [
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],

  [ProjectStatus.COMPLETED]: [],

  [ProjectStatus.CANCELLED]: [],
};
