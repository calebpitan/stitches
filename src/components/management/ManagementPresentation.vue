<script setup lang="ts">
import { computed } from 'vue'

import type { TodoListItem, TodoTag } from '@/interfaces/todo'

import EditableText from '../editable/EditableText.vue'
import TagsInput, { type TagsInputProps } from '../editable/TagsInput.vue'

interface ManagementPresentationProps extends Pick<TagsInputProps, 'onCreateTag'> {
  todo: TodoListItem
  tags: TodoTag[]
  onReview?: (id: string, patch: Partial<TodoListItem>) => void
}

const props = withDefaults(defineProps<ManagementPresentationProps>(), {})
const suggestions = computed(() => props.tags)
const todoTags = computed(() => {
  return props.tags.filter((t) => props.todo.tagIds?.includes(t.id))
})

function handleTitleModification(title: string) {
  if (!title) return props.onReview?.(props.todo.id, { title: props.todo.title + ' ' })
  props.onReview?.(props.todo.id, { title })
}

function handleSummaryModification(summary: string) {
  props.onReview?.(props.todo.id, { summary })
}

function handleTitleEnterKey(event: KeyboardEvent) {
  const target = event.currentTarget as HTMLElement
  const title = target.textContent
  if (!title) return
  handleTitleModification(title)
  target.blur()
}

function handleTagsChange(tags: TodoTag[]) {
  const uniqueTagId = new Set(tags.map((t) => t.id))
  props.onReview?.(props.todo.id, { tagIds: Array.from(uniqueTagId) })
}
</script>

<template>
  <Card class="s-management">
    <template #title>
      <EditableText
        class="s-management-title"
        :lines="2"
        :text="todo.title"
        placeholder="Title"
        @modify="handleTitleModification"
        @keydown.enter.prevent="handleTitleEnterKey"
      />
    </template>

    <template #subtitle>
      <TagsInput
        :initial-tags="todoTags"
        :suggestions="suggestions"
        @change="handleTagsChange"
        @create-tag="onCreateTag"
      />
    </template>

    <template #content>
      <EditableText
        class="s-management-summary"
        :text="todo.summary"
        :lines="3"
        placeholder="summary..."
        @modify="handleSummaryModification"
      />
    </template>
    <template #footer>
      <div class="s-management-extras"></div>
    </template>
  </Card>
</template>

<style scoped>
.s-management {
  background-color: var(--s-surface-ground);
  padding: 1rem;
  border: 0;
  box-shadow: none;
  --p-card-title-font-weight: 600;
}

.s-management-title {
  font-weight: inherit;
}

.s-management-summary {
  color: var(--s-script-secondary);
}

.s-management-extras {
  display: flex;
}
</style>
