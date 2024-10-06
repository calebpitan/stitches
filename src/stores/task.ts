import { ref } from 'vue'

import { plainToInstance } from 'class-transformer'
import { defineStore } from 'pinia'

import type { BaseTaskListItem, TaskListItem } from '@/interfaces/task'
import { TaskSerializer } from '@/serializers/task'
import { createDeserializer, createReadGuard, ulid } from '@/utils'

interface Serializables {
  tasks: TaskListItem[]
  selected: string | null
}

export const useTaskStore = defineStore(
  's-task',
  () => {
    const tasks = ref<TaskListItem[]>([])
    const selected = ref<string | null>(null)
    const guard = createReadGuard('Task')

    function findTaskIndex(id: string) {
      const index = tasks.value.findIndex((t) => t.id === id)
      return guard(index, false)
    }

    function findTask(id: string): TaskListItem | null {
      const index = findTaskIndex(id)
      const task = tasks.value.at(index)

      return task ?? null
    }

    function findSelected() {
      if (!selected.value) return null

      return findTask(selected.value)
    }

    function addTask(item: BaseTaskListItem) {
      // Skip if there's currently an empty task
      if (tasks.value.at(0)?.title.trim() === '') return
      tasks.value.unshift({
        id: ulid(),
        ...item,
        completed: item.completed ?? false,
        addedAt: new Date(),
        completedAt: item.completed ? new Date() : null,
        tagIds: []
      })
    }

    function updateTask(id: string, patch: Partial<TaskListItem>) {
      const index = findTaskIndex(id)
      const task = guard(id, findTask(id))
      const newItem: TaskListItem = { ...task, ...patch }

      if (!newItem.title) return tasks.value.splice(index, 1).at(0)!

      tasks.value.splice(index, 1, newItem)

      return newItem
    }

    function removeTask(id: string) {
      const index = findTaskIndex(id)
      guard(id, findTask(id))
      return tasks.value.splice(index, 1).at(0)!
    }

    function toggleTask(id: string) {
      const index = findTaskIndex(id)
      const item = guard(id, findTask(id))
      const timestamp = new Date()
      tasks.value.splice(index, 1, {
        ...item,
        completed: !item.completed,
        completedAt: item.completed ? null : timestamp
      })
    }

    function selectTask(id: string | null) {
      selected.value = id
    }

    return {
      tasks,
      selected,
      addTask,
      findTask,
      findSelected,
      removeTask,
      updateTask,
      toggleTask,
      selectTask
    }
  },
  {
    persist: {
      serializer: {
        serialize: JSON.stringify,
        deserialize: createDeserializer<Serializables>((data) => {
          const serialized = plainToInstance(TaskSerializer, data.tasks, {
            enableImplicitConversion: true
          })

          return { tasks: serialized, selected: data.selected }
        })
      }
    }
  }
)
