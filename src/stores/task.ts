import { ref } from 'vue'

import { plainToInstance } from 'class-transformer'
import { defineStore } from 'pinia'

import type { BaseTaskListItem, TaskListItem } from '@/interfaces/task'
import { TaskSerializer } from '@/serializers/task'
import { createDeserializer, ulid } from '@/utils'

interface Serializables {
  todos: TaskListItem[]
  selected: string | null
}

export const useTaskStore = defineStore(
  'todo',
  () => {
    const todos = ref<TaskListItem[]>([])
    const selected = ref<string | null>(null)

    function addItem(item: BaseTaskListItem) {
      // Skip if there's currently an empty todo
      if (todos.value.at(0)?.title.trim() === '') return
      todos.value.unshift({
        id: ulid(),
        ...item,
        completed: item.completed ?? false,
        addedAt: new Date(),
        completedAt: item.completed ? new Date() : null,
        tagIds: []
      })
    }

    function updateItem(id: string, patch: Partial<TaskListItem>) {
      const index = todos.value.findIndex((todo) => todo.id === id)
      const newItem = { ...todos.value.at(index)!, ...patch }
      if (!newItem.title) return todos.value.splice(index, 1)

      return todos.value.splice(index, 1, newItem)
    }

    function removeItem(id: string) {
      const index = todos.value.findIndex((todo) => todo.id === id)
      todos.value.splice(index, 1)
    }

    function toggleItem(id: string) {
      const index = todos.value.findIndex((todo) => todo.id === id)
      const item = todos.value.at(index)!
      const timestamp = new Date()
      todos.value.splice(index, 1, {
        ...item,
        completed: !item.completed,
        completedAt: item.completed ? null : timestamp
      })
    }

    function selectItem(id: string | null) {
      selected.value = id
    }

    return { todos, selected, addItem, removeItem, updateItem, toggleItem, selectItem }
  },
  {
    persist: {
      serializer: {
        serialize: JSON.stringify,
        deserialize: createDeserializer<Serializables>((data) => {
          const serialized = plainToInstance(TaskSerializer, data.todos, {
            enableImplicitConversion: true
          })

          return { todos: serialized, selected: data.selected }
        })
      }
    }
  }
)
