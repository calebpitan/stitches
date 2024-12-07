<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts" generic="D, E extends Error = Error">
import type { DataState } from '@pinia/colada'

export interface DynamicProps<D, E> {
  state: DataState<D, E>
}

defineProps<DynamicProps<D, E>>()
</script>

<template>
  <slot v-if="state.status === 'pending'" name="pending">
    <span>Loading...</span>
  </slot>
  <slot v-else-if="state.status === 'error'" name="error" :error="state.error">
    <span>An error occured {{ state.error.message }}</span>
  </slot>
  <slot v-if="state.status === 'success'" name="success" :data="state.data" />
</template>
