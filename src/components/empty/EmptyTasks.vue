<script setup lang="ts">
import VStack from '../stack/VStack.vue'
</script>

<template>
  <VStack class="s-empty" :spacing="4">
    <span class="pi pi-list s-empty-illustration" />

    <div class="s-empty-message">
      <slot name="message">
        <span>What would you like to do today 🤔? </span>
        <span>Don't overthink it. Create a task now and get kicking!</span>
      </slot>
    </div>
  </VStack>
</template>

<style scoped>
.s-empty {
  user-select: none;
  align-items: center;
  max-width: 350px;
  margin-inline: auto;
}

.s-empty-illustration {
  font-size: 1.5rem;
  background-color: var(--p-primary-color);
  color: var(--s-surface-middle);
  border-radius: 50%;
  padding: 0.75rem;
  position: relative;

  &::after {
    content: '💭';
    position: absolute;
    top: -0.4rem;
  }
}

.s-empty-message {
  text-align: center;
  font-size: 0.875rem;
  color: var(--s-script-secondary);
}
</style>
