import type { TaskSchedule } from '@stitches/common'

export type SchedulerWorkerActions = 'abort' | 'run' | 'subscribe'
export type SchedulerWorkerCommamds =
  | 'add'
  | 'drop'
  | 'drop_all'
  | 'update'
  | SchedulerWorkerActions

export interface SchedulerWorkerMsgEvtAction<C extends SchedulerWorkerCommamds> {
  command: C
}

export interface SchedulerWorkerMsgEvtData<C extends SchedulerWorkerCommamds, D>
  extends SchedulerWorkerMsgEvtAction<C> {
  data: D
}

export type TaskSchedulerWorkerMsgEvtData =
  | SchedulerWorkerMsgEvtData<'add', TaskSchedule | TaskSchedule[]>
  | SchedulerWorkerMsgEvtData<'update', TaskSchedule>
  | SchedulerWorkerMsgEvtData<'drop', string | string[]>
  | SchedulerWorkerMsgEvtData<'drop_all', undefined>

export type TaskSchedulerWorkerMsgEvtActions = SchedulerWorkerMsgEvtAction<SchedulerWorkerActions>

export type WorkerMessageEventData =
  | TaskSchedulerWorkerMsgEvtData
  | TaskSchedulerWorkerMsgEvtActions

/////////////////////////////////////////////////////////////////////////////////////////
// TRIGGERS
/////////////////////////////////////////////////////////////////////////////////////////
export type SchedulerMasterTriggers = 'due'

export interface SchedulerWorkerMsgEvtTrigger<T extends SchedulerMasterTriggers, D> {
  trigger: T
  data: D
}
export type TaskSchedulerDueTrigger = SchedulerWorkerMsgEvtTrigger<'due', { id: string }>

export type MasterMessageEventData = TaskSchedulerDueTrigger
