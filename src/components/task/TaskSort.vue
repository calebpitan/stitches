<script setup lang="ts">
import { ref, watch } from 'vue'

import IconSort from '../icons/IconSort.vue'

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
      aria-label="Sort"
      severity="secondary"
      :rounded="true"
      :text="true"
      @click="openSortMenu"
    >
      <template #icon="{ class: cls }">
        <IconSort :class="cls" />
      </template>
    </Button>
  </div>
</template>
