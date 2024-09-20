export interface BaseTodoListItem {
  title: string
  summary: string
  completed?: boolean
}

export interface TodoListItem extends BaseTodoListItem {
  id: string
  addedAt: Date
  tagIds: string[]
  completedAt: Date | null
}

export interface TodoTag {
  id: string
  label: string
}
