<script setup lang="ts">
import { ref } from 'vue'

interface SortListHandleProps {
  onDiscovery?: (disovered: boolean) => void
}

const props = withDefaults(defineProps<SortListHandleProps>(), {})
const handling = ref(false)

function handleMouseEnter() {
  handling.value = true
  props.onDiscovery?.(handling.value)
}

function handleMouseLeave() {
  handling.value = false
  props.onDiscovery?.(handling.value)
}
</script>

<template>
  <div class="s-handle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <IconDragHandle />
  </div>
</template>

<style scoped>
.s-handle {
  width: 1.625rem;
  height: 100%;
  left: 0rem;
  position: absolute;
  display: inline-flex;
  align-items: center;
  opacity: 0.1;
}
</style>
