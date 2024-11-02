<script setup lang="ts">
import { ref } from 'vue'

import SubTaskHeader from './subtask/SubTaskHeader.vue'
import SubTaskList from './subtask/SubTaskList.vue'

const items = [
  { name: 'Caleb' },
  { name: 'David' },
  { name: 'Patrick' },
  { name: 'Daniel' },
  { name: 'Dammy' },
  { name: 'Yetunde' }
]

const stacked = ref(true)
</script>

<template>
  <div class="s-subtask-control">
    <SubTaskHeader
      class="s-subtask-control-header"
      title="Subtasks"
      :stacked="stacked"
      @stacking-change="stacked = $event"
    />

    <SubTaskList :items="items" :stacked="stacked" @un-stack="stacked = false">
      <template #footer>
        <Button
          class="s-subtask-add"
          size="large"
          icon="pi pi-plus"
          :label="'Add Subtask'"
          :text="true"
        />
      </template>
    </SubTaskList>
  </div>
</template>

<style scoped>
.s-subtask-control {
  display: flex;
  flex-direction: column;
  padding: var(--s-base-padding);
}

.s-subtask-control-header {
  border-radius: 0 var(--s-cornered-radius) var(--s-cornered-radius) 0;
  background-color: var(--s-surface-ground);
  padding: calc(var(--s-base-padding) / 2) 1rem calc(var(--s-base-padding) / 2)
    var(--s-base-padding);
  margin-inline-start: calc(-1 * var(--s-base-padding));
}

.s-subtask-add {
  border-width: 1px;
  border-style: dashed;
  border-color: var(--p-primary-color);
  font-size: 0.875rem;
}
</style>
