export interface BaseTaskListItem {
  title: string
  summary: string
  completed?: boolean
}

export interface TaskListItem extends BaseTaskListItem {
  id: string
  addedAt: Date
  tagIds: string[]
  completedAt: Date | null
}

export interface TaskTag {
  id: string
  label: string
}
