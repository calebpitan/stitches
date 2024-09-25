import { ref } from 'vue'

import { plainToInstance } from 'class-transformer'
import { defineStore } from 'pinia'

import type { BaseTaskListItem, TaskListItem } from '@/interfaces/task'
import { TaskSerializer } from '@/serializers/task'
import { createDeserializer, ulid } from '@/utils'

interface Serializables {
  tasks: TaskListItem[]
  selected: string | null
}

export const useTaskStore = defineStore(
  's-task',
  () => {
    const tasks = ref<TaskListItem[]>([])
    const selected = ref<string | null>(null)

    function addItem(item: BaseTaskListItem) {
      // Skip if there's currently an empty todo
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

    function updateItem(id: string, patch: Partial<TaskListItem>) {
      const index = tasks.value.findIndex((todo) => todo.id === id)
      const newItem = { ...tasks.value.at(index)!, ...patch }
      if (!newItem.title) return tasks.value.splice(index, 1)

      return tasks.value.splice(index, 1, newItem)
    }

    function removeItem(id: string) {
      const index = tasks.value.findIndex((todo) => todo.id === id)
      tasks.value.splice(index, 1)
    }

    function toggleItem(id: string) {
      const index = tasks.value.findIndex((todo) => todo.id === id)
      const item = tasks.value.at(index)!
      const timestamp = new Date()
      tasks.value.splice(index, 1, {
        ...item,
        completed: !item.completed,
        completedAt: item.completed ? null : timestamp
      })
    }

    function selectItem(id: string | null) {
      selected.value = id
    }

    return { tasks, selected, addItem, removeItem, updateItem, toggleItem, selectItem }
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
