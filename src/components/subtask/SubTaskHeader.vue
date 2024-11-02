<script setup lang="ts">
import StackingToggle, { type StackingToggleProps } from '../list/StackingToggle.vue'

type SubTaskHeaderEmits = { stackingChange: [stacked: boolean] }
interface SubTaskHeaderProps {
  title: string
  stacked: boolean
  toggleLabel?: StackingToggleProps['label']
}

const props = withDefaults(defineProps<SubTaskHeaderProps>(), {})
const emit = defineEmits<SubTaskHeaderEmits>()

function toggleStacking() {
  emit('stackingChange', !props.stacked)
}
</script>

<template>
  <div class="s-subtask-header">
    <div class="s-subtask-header-title">{{ title }}</div>
    <div class="s-subtask-header-controls">
      <StackingToggle :stacked="stacked" :label="toggleLabel" @toggle="toggleStacking()" />
    </div>
  </div>
</template>

<style scoped>
.s-subtask-header {
  display: flex;
  width: 100%;
  align-items: center;
}

.s-subtask-header-title {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1;
  color: var(--s-script-secondary);
}

.s-subtask-header-controls {
  margin-inline-start: auto;
}
/* 
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-out;
} */
</style>
