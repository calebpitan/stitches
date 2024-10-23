<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import HStack from './HStack.vue'
import VStack from './VStack.vue'

interface StackProps {
  type: 'hstack' | 'vstack'
  spacing?: number
}

const props = withDefaults(defineProps<StackProps>(), { spacing: 8 })
const { type, ...rest } = props
</script>

<template>
  <HStack v-if="type === 'hstack'" v-bind="rest">
    <slot />
  </HStack>
  <VStack v-else v-bind="rest">
    <slot />
  </VStack>
</template>
