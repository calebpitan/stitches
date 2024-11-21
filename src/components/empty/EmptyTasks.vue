<script setup lang="ts">
import { emptyTaskList } from '@/utils/assets'

import VStack from '../stack/VStack.vue'

type EmptyTasksEmits = {
  emptyAction: []
}

const emit = defineEmits<EmptyTasksEmits>()
</script>

<template>
  <VStack class="s-empty" :spacing="4">
    <span class="s-empty-illustration" :style="{ '--empty-image-url': `url(${emptyTaskList})` }" />

    <div class="s-empty-message">
      <slot name="message">
        <span>What would you like to do today, tomorrow, and the day after?</span>
        <Button label="Add a task" size="small" :fluid="true" @click="emit('emptyAction')" />
      </slot>
    </div>
  </VStack>
</template>

<style scoped>
.s-empty {
  user-select: none;
  align-items: center;
  max-width: 350px;
  margin-inline: auto;
}

.s-empty-illustration {
  font-size: 1.5rem;
  width: 100%;
  height: 150px;
  background-size: 250px;
  background-position: center;
  background-repeat: no-repeat;
  background-image: var(--empty-image-url);
  color: var(--s-surface-middle);
  border-radius: 50%;
  padding: 0.75rem;
  position: relative;
}

.s-empty-message {
  text-align: center;
  font-size: 0.875rem;
  color: var(--s-script-secondary);

  & * + * {
    margin-block-start: 1rem;
  }
}
</style>
