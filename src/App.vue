<script setup lang="ts">
import { RouterView } from 'vue-router'

import IOWorkerContext from './components/context/IOWorkerContext.vue'
</script>

<template>
  <Suspense>
    <IOWorkerContext>
      <RouterView />
    </IOWorkerContext>

    <template #fallback> Loading... </template>
  </Suspense>
</template>

<style scoped></style>
