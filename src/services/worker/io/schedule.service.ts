import type { BaseTaskSchedule, TaskSchedule } from '@stitches/common'

import { AbstractService } from './abstract.service'
import { ObjectAdapter } from './object.adapter'

export class ScheduleService extends AbstractService {
  async getSchedule(id: string): Promise<TaskSchedule> {
    const schedule = await this.io.repo.schedulesFacade.only(id)
    return ObjectAdapter.toTaskSchedule(schedule)
  }

  async replaceSchedule(substitute: BaseTaskSchedule | TaskSchedule) {
    const replacement = await this.io.repo.schedulesFacade.replace(substitute)
    return ObjectAdapter.toTaskSchedule(replacement)
  }

  async clearSchedule(id: string) {
    return await this.io.repo.schedulesFacade.remove(id)
  }
}
