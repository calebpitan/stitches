<script setup lang="ts">
import { computed } from 'vue'

type Label = { icon: string; text: string }
type StackingToggleEmits = { toggle: [value: boolean] }
export interface StackingToggleProps {
  stacked: boolean
  label?: (stacked: boolean) => Partial<Label>
}

const props = withDefaults(defineProps<StackingToggleProps>(), {})
const emit = defineEmits<StackingToggleEmits>()

const label = computed(() => {
  const custom = props.label?.(props.stacked)
  return props.stacked
    ? { icon: 'pi-angle-down', text: 'Unstack all', ...custom }
    : { icon: 'pi-angle-up', text: 'Stack all', ...custom }
})

function toggle() {
  emit('toggle', !props.stacked)
}
</script>

<template>
  <Button
    class="s-stacking-toggle"
    size="small"
    severity="secondary"
    :label="label.text"
    @click="toggle()"
  >
    <slot name="icon">
      <span :class="['pi', label.icon]" />
    </slot>

    <slot name="text" class="skkld">
      <span class="s-button-label">{{ label.text }}</span>
    </slot>
  </Button>
</template>

<style scoped>
.s-stacking-toggle {
  font-size: 0.875rem;
  min-width: 116px;
  border-radius: var(--s-cornered-radius);
  color: var(--s-script-secondary);

  & .s-button-label {
    font-weight: 400;
    flex-grow: 1;
  }
}
</style>
