export enum QueueType {
  ENROLLMENT          = 'enrollment',
  START               = 'start',
  IMPORTS             = 'imports',
  TRANSITION          = 'transition',
  EVENTS_PG_SYNC      = 'events_pg_sync',

  CUSTOMER_CHANGE     = 'customer_change',
  SEGMENT_UPDATE      = 'segment_update',

  INTEGRATIONS        = 'integrations',
  CUSTOMERS           = 'customers',

  EVENTS              = 'events',
  EVENTS_PRE          = 'events_pre',
  EVENTS_POST         = 'events_post',
  MESSAGE             = 'message',
  SLACK               = 'slack',
  WEBHOOKS            = 'webhooks',

  START_STEP          = 'start.step',
  WAIT_UNTIL_STEP     = 'wait.until.step',
  MESSAGE_STEP        = 'message.step',
  JUMP_TO_STEP        = 'jump.to.step',
  TIME_DELAY_STEP     = 'time.delay.step',
  TIME_WINDOW_STEP    = 'time.window.step',
  MULTISPLIT_STEP     = 'multisplit.step',
  EXPERIMENT_STEP     = 'experiment.step',
  EXIT_STEP           = 'exit.step',
}