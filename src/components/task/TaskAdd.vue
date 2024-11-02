<script setup lang="ts">
import type { BaseTaskListItem } from '@/interfaces/task'

export type TaskAddEmits = { add: [item: BaseTaskListItem] }
export interface TaskAddProps {}

defineProps<TaskAddProps>()
const emit = defineEmits<TaskAddEmits>()

function addEmptyTask() {
  emit('add', { title: '', summary: '' })
}
</script>

<template>
  <Button
    type="button"
    id="new-task-button"
    icon="pi pi-plus"
    aria-label="Add"
    severity="secondary"
    @click="addEmptyTask"
    rounded
    text
  />
</template>
