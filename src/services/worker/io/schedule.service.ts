/// <reference lib="webworker" />
import type { BaseTaskSchedule, TaskSchedule } from '@stitches/common'

import { AbstractService } from './abstract.service'
import { synchronized } from './decorator'
import { ObjectAdapter } from './object.adapter'

export class ScheduleService extends AbstractService {
  async getSchedule(id: string): Promise<TaskSchedule> {
    const schedule = await this.io.repo.schedulesFacade.only(id)
    return ObjectAdapter.toTaskSchedule(schedule)
  }

  @synchronized()
  async replaceSchedule(substitute: BaseTaskSchedule | TaskSchedule) {
    const replacement = await this.io.repo.schedulesFacade.replace(substitute)
    return ObjectAdapter.toTaskSchedule(replacement)
  }

  @synchronized()
  async clearSchedule(id: string) {
    return await this.io.repo.schedulesFacade.remove(id)
  }
}
