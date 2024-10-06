<script setup lang="ts">
import { ref, watch } from 'vue'

type Sort = -1 | 1

export type TaskSortConfig = Partial<{ addedAt: Sort; completedAt: Sort }>

export interface TaskSortProps {
  onSort: (config: TaskSortConfig) => void
}

const props = defineProps<TaskSortProps>()

const config = ref<TaskSortConfig>({})

function openSortMenu() {}

watch(config, (cfg) => {
  props.onSort(cfg)
})
</script>

<template>
  <div>
    <Button
      type="button"
      id="new-task-button"
      icon="pi pi-sort-alt"
      aria-label="Sort"
      severity="secondary"
      @click="openSortMenu"
      rounded
      text
    />
  </div>
</template>
