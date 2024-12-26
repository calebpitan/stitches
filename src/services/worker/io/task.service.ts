/// <reference lib="webworker" />
import { evaluate, unique } from '@stitches/common'
import type { TaskSchedule } from '@stitches/common'
import { Op } from '@stitches/io'
import type { Association, schedule, tag } from '@stitches/io'

import type { BaseTaskListItem, TaskListItem, TaskTag } from '@/interfaces/task'
import { datetime, getUpcomingSchedules } from '@/utils'

import { AbstractService } from './abstract.service'
import { synchronized } from './decorator'
import { ObjectAdapter } from './object.adapter'

type _TaskFilters = {
  /**
   * Filter tasks that are either completed or pending
   */
  state?: 'completed' | 'pending'
  /**
   * Filter for recently created tasks which is a group of task
   */
  recent?: true
  due?: true
  scheduled?: true
  today?: true
}

export class TaskService extends AbstractService {
  @synchronized()
  async createTask(data: BaseTaskListItem): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.createOne({
      title: data.title,
      summary: data.summary,
    })
    return ObjectAdapter.toTaskListItem(task)
  }

  @synchronized()
  async updateTask(id: string, patch: Partial<BaseTaskListItem>): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.update(id, {
      title: patch.title,
      summary: patch.summary,
    })

    return ObjectAdapter.toTaskListItem(task)
  }

  @synchronized()
  async redactTask(id: string): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.redact(id)
    return ObjectAdapter.toTaskListItem(task)
  }

  async getTask(id: string): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.only(id)
    return ObjectAdapter.toTaskListItem(task)
  }

  async getTasks(): Promise<TaskListItem[]> {
    const tasks = await this.io.repo.tasks.all()
    return tasks.map((task) => ObjectAdapter.toTaskListItem(task))
  }

  async getSchedulesForTasks(ids: string[]): Promise<TaskSchedule[]> {
    const criteria = this.io.repo.schedules.getCriteriaBuilder().on('taskId', Op.IN, ids).build()
    const schedules = await this.io.repo.schedules
      .all(criteria)
      .then((s) => this.io.repo.schedulesFacade.load(s))
    const result = schedules.map((schedule) => ObjectAdapter.toTaskSchedule(schedule))
    return unique(result, (v) => v.id)
  }

  async getTagsForTasks(ids: string[]): Promise<Record<string, Association<'tags'>['tags']>> {
    const associations = Object.fromEntries(
      await Promise.all(
        ids.map(async (id) => {
          const assoc = await this.io.repo.tasks.tags.associations(id, 'tags')
          return [id, assoc.tags] as const
        }),
      ),
    )

    return associations
  }

  // tagTask(id: string, tag: Pick<TaskTag, 'id'>): Promise<tag.Tag>
  // tagTask(id: string, tag: Pick<TaskTag, 'label'>): Promise<tag.Tag>
  @synchronized()
  async tagTask(id: string, tag: Pick<TaskTag, 'id'> | Pick<TaskTag, 'label'>): Promise<tag.Tag> {
    if ('id' in tag) {
      const tagObj = await this.io.repo.tags.only(tag.id)
      await this.io.repo.tasks.tags.associate(id, tagObj.id)
      return tagObj
    }

    // prettier-ignore
    const criteria = this.io.repo.tags
      .getCriteriaBuilder()
      .on('label', Op.EQ, tag.label)
      .build()

    const tagObj = await this.io.repo.tags
      .all(criteria)
      .then((v) => v.at(0) || this.io.repo.tags.create({ label: tag.label }))

    await this.io.repo.tasks.tags.associate(id, tagObj.id)
    return tagObj
  }

  @synchronized()
  async untagTask(id: string, tag: Pick<TaskTag, 'id'> | Pick<TaskTag, 'label'>): Promise<tag.Tag> {
    if ('id' in tag) {
      const tagObj = await this.io.repo.tags.only(tag.id)
      await this.io.repo.tasks.tags.unassociate(id, tagObj.id)
      return tagObj
    }

    // prettier-ignore
    const criteria = this.io.repo.tags
      .getCriteriaBuilder()
      .on('label', Op.EQ, tag.label)
      .build()

    const tagObj = await this.io.repo.tags
      .all(criteria)
      .then((v) => v.at(0) || this.io.repo.tags.create({ label: tag.label }))

    await this.io.repo.tasks.tags.unassociate(id, tagObj.id)
    return tagObj
  }

  // @synchronized()
  async markAsCompleted(id: string) {
    const schedule = await evaluate(async (): Promise<schedule.ScheduleUnion | undefined> => {
      const criteria = this.io.repo.schedules.gcb().on('taskId', Op.EQ, id).build()
      const schedules = await this.io.repo.schedulesFacade.all(criteria)
      return schedules.at(0)
    })

    const timeseries = await evaluate(async () => {
      if (!schedule) {
        return this.io.repo.timeseries.createOne({ dueAt: new Date(), taskId: id })
      }

      const taskSchedule = ObjectAdapter.toTaskSchedule(schedule)
      const upcomingDatetime = getUpcomingSchedules(taskSchedule) || datetime(schedule.anchoredAt)

      const criteria = this.io.repo.timeseries
        .gcb()
        .on('taskId', Op.EQ, id)
        .sort('dueAt', 1)
        .take(1)
        .build()
      const result = await this.io.repo.timeseries
        .allUncompleted(criteria)
        .then(([uncompleted]) => {
          if (uncompleted === undefined) {
            return this.io.repo.timeseries.createOne({
              dueAt: upcomingDatetime.toJSDate(),
              taskId: id,
            })
          }
          return uncompleted
        })
      return result
    })

    const completion = await this.io.repo.completions.createOne({
      completedAt: new Date(),
      timeSeriesId: timeseries.id,
      taskId: timeseries.taskId,
    })

    return { completion, timeseries }
  }
}
