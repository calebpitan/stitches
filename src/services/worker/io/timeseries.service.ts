/// <reference lib="webworker" />
import { AbstractService } from './abstract.service'
import { synchronized } from './decorator'

type BaseTimeSeries = { dueAt: Date; taskId: string }
export class TimeSeriesService extends AbstractService {
  async getTimeSeriez(id: string) {
    const timeseries = await this.io.repo.timeseries.only(id)
    return timeseries
  }

  async getTimeSeries() {
    const timeseries = await this.io.repo.timeseries.all()
    return timeseries
  }

  @synchronized()
  async createTimeSeries(data: BaseTimeSeries) {
    const timeseries = await this.io.repo.timeseries.createOne({
      taskId: data.taskId,
      dueAt: data.dueAt,
    })

    return timeseries
  }
}
