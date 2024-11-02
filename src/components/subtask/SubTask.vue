<script setup lang="ts">
import type { CardProps } from 'primevue/card'

export interface SubTaskProps extends CardProps {
  title: string
}

const _props = withDefaults(defineProps<SubTaskProps>(), {})
</script>

<template>
  <div class="s-subtask">
    <div class="s-subtask-body">
      <span class="s-subtask-title">{{ title }}</span>
    </div>

    <slot name="drag-handle" />
  </div>
</template>

<style scoped>
.s-subtask {
  border-width: 0;
  border-style: solid;
  border-color: rgba(from #8e8e8e r g b / 0.3);
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-block: auto;
  box-shadow: var(--p-card-shadow);
}

.s-subtask-body {
  padding: calc(var(--s-base-padding) / 2);
}

.s-subtask-title {
  font-size: 0.875rem;
  font-weight: 400;
}

.s-subtask-content {
  color: var(--s-script-secondary);
  font-size: 0.875rem;
}
</style>
