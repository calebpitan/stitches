<script setup lang="ts">
import { ref, watch } from 'vue'

import IconSidebar from '../icons/IconSidebar.vue'

interface SidebarControlProps {
  open?: boolean
  onToggle: (open: boolean) => void
}

const props = withDefaults(defineProps<SidebarControlProps>(), { open: true })

const isOpen = ref(props.open)

function handleToggle() {
  const newValue = (isOpen.value = !isOpen.value)
  props.onToggle(newValue)
}

watch(props, (p) => (isOpen.value = p.open))
</script>

<template>
  <div class="s-sidebar-control">
    <Button :text="true" :rounded="true" severity="secondary" @click="handleToggle">
      <template #icon>
        <IconSidebar />
      </template>
    </Button>
  </div>
</template>

<style>
.s-sidebar-control {
  display: flex;
  align-items: center;
  height: var(--p-button-icon-only-width);
  width: 100%;
}
</style>
