<script setup lang="ts">
import type { BaseTodoListItem } from '@/interfaces/todo'
import Popover from 'primevue/popover'
import { ref, watch } from 'vue'

export interface TodoFormProps {
  onAddTodo: (item: BaseTodoListItem) => void
}

const props = defineProps<TodoFormProps>()

const popover = ref<InstanceType<typeof Popover> | null>(null)
const title = ref('')
const description = ref('')
const disabled = ref(!title.value.trim())

watch(title, () => (disabled.value = !title.value.trim()))

function handleSubmit() {
  props.onAddTodo({ title: title.value, summary: description.value })
  title.value = description.value = ''
}
</script>

<template>
  <Button type="button" icon="pi pi-plus" aria-label="Add" @click="popover?.toggle" rounded text />

  <OverlayPanel ref="popover">
    <form class="s-form" @submit.prevent="handleSubmit">
      <FloatLabel>
        <InputText v-model="title" />
        <label>Title</label>
      </FloatLabel>

      <FloatLabel>
        <Textarea v-model="description" rows="2" autoResize />
        <label>Description</label>
      </FloatLabel>

      <Button type="submit" label="Add" :disabled="disabled"></Button>
    </form>
  </OverlayPanel>
</template>

<style scoped>
.s-form {
  display: flex;
  flex-direction: column;
  margin: 2rem 1.5rem;
}

.s-form > * + * {
  margin-top: 2rem;
}
</style>
