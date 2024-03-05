import { BadRequestException } from '@nestjs/common';

export const KEYS_TO_SKIP = [
  '__v',
  '_id',
  'id',
  'ownerId',
  'workspaceId',
  'verified',
  'journeys',
  'journeyEnrollmentsDates',
  'verified',
  'isAnonymous',
  'customComponents',
  'createdAt',
  'workflows',
  'posthogId',
  'slackTeamId',
];

export const validateKeyForMutations = (val: any) => {
  const strVal = String(val);

  if (
    !strVal ||
    KEYS_TO_SKIP.includes(strVal) ||
    strVal.startsWith('__') ||
    strVal.startsWith('_') ||
    strVal.startsWith('$')
  )
    throw new BadRequestException(
      'Inappropriate key name to create attribute. Please try another one.'
    );
};
