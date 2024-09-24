import { ref } from 'vue'

import { defineStore } from 'pinia'

import type { BaseTodoListItem, TodoListItem } from '@/interfaces/todo'
import { ulid } from '@/utils'

export const useTodoStore = defineStore(
  'todo',
  () => {
    const todos = ref<TodoListItem[]>([])
    const selected = ref<string | null>(null)

    function addItem(item: BaseTodoListItem) {
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

    function updateItem(id: string, patch: Partial<TodoListItem>) {
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
      // serializer: {
      //   serialize: JSON.stringify,
      //   deserialize: (...args: Parameters<typeof JSON.parse>) => {
      //     const data = JSON.parse(...args) as { todos: Array<TodoListItem> }
      //     data.todos = data.todos.map((d) => ({
      //       ...d,
      //       // @ts-ignore
      //       summary: d.description,
      //       description: undefined
      //     }))
      //     return data
      //   }
      // }
      serializer: {
        serialize: JSON.stringify,
        deserialize: (...args: Parameters<typeof JSON.parse>) => {
          const data = JSON.parse(args[0], (key, value) => {
            const reviver = args[1]
            const transform =
              ['completedAt', 'addedAt'].includes(key) && value ? new Date(value) : value
            return reviver ? reviver(key, transform) : transform
          })
          data.tagIds = undefined
          data.todos.map((t: any) => ({ ...t, tagIds: [] }))
          return data
        }
      }
    }
  }
)
