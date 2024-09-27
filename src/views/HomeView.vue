<script setup lang="ts">
import TaskControl from '@/components/TaskControl.vue'
import TaskManagement from '@/components/TaskManagement.vue'
</script>

<template>
  <main class="s-main">
    <Splitter class="s-layout">
      <SplitterPanel :size="45" :min-size="45">
        <TaskControl />
      </SplitterPanel>

      <SplitterPanel :size="55" :min-size="40" style="overflow: auto">
        <TaskManagement />
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
