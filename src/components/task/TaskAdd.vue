<script setup lang="ts">
import type { BaseTaskListItem } from '@/interfaces/task'

export interface TaskAddProps {
  onAdd: (item: BaseTaskListItem) => void
}

const props = defineProps<TaskAddProps>()

function addEmptyTask() {
  props.onAdd({ title: '', summary: '' })
}
</script>

<template>
  <Button
    type="button"
    id="new-task-button"
    icon="pi pi-plus"
    aria-label="Add"
    @click="addEmptyTask"
    rounded
    text
  />
</template>
