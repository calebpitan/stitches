<script setup lang="ts">
import TodoControl from '@/components/TodoControl.vue'
import TodoManagement from '@/components/TodoManagement.vue'
</script>

<template>
  <main class="s-main">
    <Splitter class="s-layout">
      <SplitterPanel :size="45" :min-size="45">
        <TodoControl />
      </SplitterPanel>

      <SplitterPanel :size="55" :min-size="40" style="overflow: auto">
        <TodoManagement />
      </SplitterPanel>
    </Splitter>
  </main>
</template>

<style scoped>
.s-main {
  height: 100%;
}

.s-layout {
  display: flex;
  background-color: var(--s-surface-middle);
  height: 100%;
}
</style>
