<script setup lang="ts">
import { ref, watch } from 'vue'

import IconSort from '../icons/IconSort.vue'

type Sort = -1 | 1

export type TaskSortConfig = Partial<{ addedAt: Sort; completedAt: Sort }>
export type TaskSortEmits = { sort: [config: TaskSortConfig] }
export interface TaskSortProps {}

defineProps<TaskSortProps>()
const emit = defineEmits<TaskSortEmits>()

const config = ref<TaskSortConfig>({})

function openSortMenu() {}

watch(config, (cfg) => {
  emit('sort', cfg)
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
