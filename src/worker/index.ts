import { Observable } from 'rxjs'

import type { TaskSchedule } from '@/interfaces/schedule'

import type { MasterMessageEventData, WorkerMessageEventData } from './types'

export interface SchedulerController {
  add(schedule: TaskSchedule): void
  add(schedule: TaskSchedule[]): void
  observer: Observable<MasterMessageEventData>
}

function msgFactory(msg: WorkerMessageEventData) {
  return msg
}

export function SchedulerWorker(): SchedulerController {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

  const controller: SchedulerController = {
    observer: undefined!,
    add(schedule) {
      worker.postMessage(msgFactory({ command: 'add', data: schedule }))
    }
  }

  const ob = new Observable<MasterMessageEventData>((subscriber) => {
    worker.postMessage(msgFactory({ command: 'subscribe' }))
    worker.postMessage(msgFactory({ command: 'run' }))
    worker.addEventListener('message', (ev: MessageEvent<MasterMessageEventData>) => {
      subscriber.next(ev.data)
    })

    return () => worker.postMessage(msgFactory({ command: 'abort' }))
  })

  controller.observer = ob

  return controller
}
