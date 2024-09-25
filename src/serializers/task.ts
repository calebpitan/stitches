import { Type } from 'class-transformer'

import type { TaskListItem, TaskTag } from '@/interfaces/task'

export class TaskSerializer implements TaskListItem {
  id: string

  @Type(() => Boolean) completed?: boolean | undefined

  title: string
  summary: string
  tagIds: string[]

  @Type(() => Date) addedAt: Date
  @Type(() => Date) completedAt: Date | null
}

export class TaskTagSerializer implements TaskTag {
  id: string
  label: string
}
