<script setup lang="ts">
interface HStackProps {
  spacing?: number
}

withDefaults(defineProps<HStackProps>(), { spacing: 8 })
const factor = 1 / 2
</script>

<template>
  <div class="s-hstack" :style="{ gap: `${spacing * factor}rem` }">
    <slot />
  </div>
</template>

<style scoped>
.s-hstack {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
}
</style>
