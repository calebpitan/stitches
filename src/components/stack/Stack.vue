<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import HStack from './HStack.vue'
import VStack from './VStack.vue'

interface StackProps {
  type: 'hstack' | 'vstack'
  spacing?: number
}

withDefaults(defineProps<StackProps>(), { spacing: 8 })
</script>

<template>
  <HStack v-if="type === 'hstack'">
    <slot />
  </HStack>
  <VStack v-else>
    <slot />
  </VStack>
</template>
