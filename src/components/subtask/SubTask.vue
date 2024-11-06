<script setup lang="ts">
import { ref } from 'vue'

import type { CardProps } from 'primevue/card'

export interface SubTaskProps extends CardProps {
  title: string
  completed: boolean
}

const props = withDefaults(defineProps<SubTaskProps>(), {})
const checked = ref(props.completed)
</script>

<template>
  <div class="s-subtask">
    <div class="s-subtask-presentation">
      <span class="s-subtask-check-status">
        <Checkbox class="s-checkbox" v-model="checked" :binary="true">
          <template #icon>
            <span class="s-checkbox-checked-icon" />
          </template>
        </Checkbox>
      </span>

      <div class="s-subtask-body">
        <span class="s-subtask-title">{{ title }}</span>
      </div>
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

.s-subtask-presentation {
  display: flex;
  align-items: center;
  padding: calc(var(--s-base-padding) / 2);
}

.s-subtask-check-status {
  --p-checkbox-background: rgba(var(--s-surface-elevated-rgb) / 0.3);
  --p-checkbox-border-radius: 50%;
  --p-checkbox-checked-border-color: transparent;

  display: contents;

  & > .s-checkbox:has(> input:checked) {
    & .s-checkbox-checked-icon {
      width: 100%;
      height: 100%;
      color: var(--p-primary-contrast-color);
      border-radius: inherit;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      background-color: var(--p-primary-color);
      border: 2px solid var(--s-surface-elevated);

      &::before {
        content: '\2713';
        width: inherit;
        height: inherit;
        font-weight: 700;
        font-size: xx-small;
        display: inline-flex;
        justify-content: center;
        align-items: center;
      }
    }

    & > :first-child {
      &:hover {
        border-color: transparent;
      }
    }

    & > :last-child {
      position: relative;
      box-shadow:
        0 0 0 0.5px var(--p-primary-color),
        0 0 0 0 rgba(0, 0, 0, 1);

      &:hover {
        border-color: transparent;
      }
    }
  }
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
