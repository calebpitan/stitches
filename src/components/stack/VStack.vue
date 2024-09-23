<script setup lang="ts">
interface VStackProps {
  spacing?: number
}

withDefaults(defineProps<VStackProps>(), { spacing: 8 })
const factor = 1 / 2
</script>

<template>
  <div class="s-vstack" :style="{ gap: `${spacing * factor}rem` }">
    <slot />
  </div>
</template>

<style scoped>
.s-vstack {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
</style>
