<script setup lang="ts">
import { computed } from 'vue'

import type { TaskListItem, TaskTag } from '@/interfaces/task'

import EditableText from '../editable/EditableText.vue'
import TagsInput, { type TagsInputProps } from '../editable/TagsInput.vue'
import OverflowBox from '../overflow/OverflowBox.vue'


type ManagementPresentationEmits = {
  review: [id:string, patch: Partial<TaskListItem>]
}

interface MgmtPresentationProps extends Pick<TagsInputProps, 'onCreateTag'> {
  task: TaskListItem
  tags: TaskTag[]
}

const props = withDefaults(defineProps<MgmtPresentationProps>(), {})
const emit = defineEmits<ManagementPresentationEmits>()

const suggestions = computed(() => props.tags)
const taskTags = computed(() => {
  return props.tags.filter((t) => props.task.tagIds?.includes(t.id))
})

function handleTitleModification(title: string) {
  if (!title) return emit('review', props.task.id, { title: props.task.title + '\u200B' })
  emit('review', props.task.id, { title })
}

function handleSummaryModification(summary: string) {
   emit('review', props.task.id, { summary })
}

function handleTagsChange(tags: TaskTag[]) {
  const uniqueTagId = new Set(tags.map((t) => t.id))
   emit('review', props.task.id, { tagIds: Array.from(uniqueTagId) })
}
</script>

<template>
  <div>
    <Card class="s-management">
      <template #title>
        <EditableText
          class="s-management-title"
          placeholder="Title"
          :key="task.title"
          :text="task.title"
          :multiline="false"
          @modify="handleTitleModification"
        />
      </template>

      <template #subtitle>
        <TagsInput
          :initial-tags="taskTags"
          :suggestions="suggestions"
          @change="handleTagsChange"
          @create-tag="onCreateTag"
        />
      </template>

      <template #content>
        <OverflowBox>
          <EditableText
            class="s-management-summary"
            placeholder="summary..."
            :key="task.summary"
            :text="task.summary"
            :multiline="true"
            @modify="handleSummaryModification"
          />
        </OverflowBox>
      </template>
      <template #footer>
        <div class="s-management-extras"></div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.s-management {
  padding: 1rem;
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
