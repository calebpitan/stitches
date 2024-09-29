import { ref } from 'vue'

import { defineStore } from 'pinia'

import type { TaskTag } from '@/interfaces/task'
import { ulid } from '@/utils'

export const useTaskTagStore = defineStore(
  's-task-tag',
  () => {
    const tags = ref<TaskTag[]>([])

    function getTagIndex(labelOrId: string) {
      const tagIndex = tags.value.findIndex((t) => {
        return t.label === labelOrId.trim() || t.id === labelOrId.trim()
      })

      return tagIndex
    }

    function getTag(labelOrId: string): TaskTag | null {
      const index = getTagIndex(labelOrId)
      const tag = tags.value.at(index)

      return tag ?? null
    }

    function createTag(label: string): TaskTag {
      const existing = tags.value.find((t) => t.label === label.trim())
      if (existing) return existing

      const tag: TaskTag = { id: ulid(), label: label.trim() }
      tags.value.push(tag)

      return tag
    }

    function deleteTag(labelOrId: string): TaskTag | null {
      const index = getTagIndex(labelOrId)
      if (index === -1) return null
      return tags.value.splice(index, 1).at(0)!
    }

    return { tags, getTag, createTag, deleteTag }
  },
  { persist: true }
)
