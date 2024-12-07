<script setup lang="ts">
import type { TaskListItem, TaskTag } from '@/interfaces/task'
import type { Patch } from '@/services/types'

import EditableText from '../editable/EditableText.vue'
import TagsInput from '../editable/TagsInput.vue'
import OverflowBox from '../overflow/OverflowBox.vue'

type ManagementPresentationEmits = {
  review: [patch: Patch<Partial<TaskListItem>>]
  addTag: [tag: TaskTag | Pick<TaskTag, 'label'>]
  removeTag: [tag: TaskTag | Pick<TaskTag, 'label'>]
}

interface MgmtPresentationProps {
  task: TaskListItem
  tags: TaskTag[]
  suggestions: TaskTag[]
}

const props = withDefaults(defineProps<MgmtPresentationProps>(), {})
const emit = defineEmits<ManagementPresentationEmits>()

function handleTitleModification(title: string) {
  if (!title)
    return emit('review', { id: props.task.id, data: { title: props.task.title + '\u200B' } })
  emit('review', { id: props.task.id, data: { title } })
}

function handleSummaryModification(summary: string) {
  emit('review', { id: props.task.id, data: { summary } })
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
          :tags="tags"
          :suggestions="suggestions"
          @create="emit('addTag', { label: $event })"
          @add="emit('addTag', $event)"
          @remove="emit('removeTag', $event)"
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
