import type { TodoTag } from '@/interfaces/todo'
import { defineStore } from 'pinia'
import { ulid } from '@/utils'
import { ref } from 'vue'

export const useTodoTagStore = defineStore(
  'todo-tag',
  () => {
    const tags = ref<TodoTag[]>([])

    function getTagIndex(labelOrId: string) {
      const tagIndex = tags.value.findIndex((t) => {
        return t.label === labelOrId.trim() || t.id === labelOrId.trim()
      })

      return tagIndex
    }

    function getTag(labelOrId: string): TodoTag | null {
      const index = getTagIndex(labelOrId)
      const tag = tags.value.at(index)

      return tag ?? null
    }

    function createTag(label: string): TodoTag {
      const existing = tags.value.find((t) => t.label === label.trim())
      if (existing) return existing

      const tag: TodoTag = { id: ulid(), label: label.trim() }
      tags.value.push(tag)

      return tag
    }

    function deleteTag(labelOrId: string): TodoTag | null {
      const index = getTagIndex(labelOrId)
      return tags.value.splice(index, 1).at(0) ?? null
    }

    return { tags, getTag, createTag, deleteTag }
  },
  { persist: true }
)
