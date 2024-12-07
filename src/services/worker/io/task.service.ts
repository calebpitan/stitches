/// <reference lib="webworker" />
import { type TaskSchedule, unique } from '@stitches/common'
import { Op } from '@stitches/io'
import type { Association, tag } from '@stitches/io'

import type { BaseTaskListItem, TaskListItem, TaskTag } from '@/interfaces/task'

import { AbstractService } from './abstract.service'
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
  async createTask(data: BaseTaskListItem): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.createOne({
      title: data.title,
      summary: data.summary,
    })
    return ObjectAdapter.toTaskListItem(task)
  }

  async updateTask(id: string, patch: Partial<BaseTaskListItem>): Promise<TaskListItem> {
    const task = await this.io.repo.tasks.update(id, {
      title: patch.title,
      summary: patch.summary,
    })

    return ObjectAdapter.toTaskListItem(task)
  }

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
}
