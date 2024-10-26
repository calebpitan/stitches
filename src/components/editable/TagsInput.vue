<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'

import Popover from 'primevue/popover'

import type { TaskTag } from '@/interfaces/task'

export interface TagsInputProps {
  initialTags?: TaskTag[]
  suggestions?: TaskTag[]
  onCreateTag: (label: string) => TaskTag
  onChange: (tags: TaskTag[]) => void
}

const props = withDefaults(defineProps<TagsInputProps>(), {
  initialTags: () => [],
  suggestions: () => []
})

const ids = { tags_input: useId() }

const inputRef = ref<HTMLInputElement | null>(null)
const popover = ref<InstanceType<typeof Popover> | null>(null)

const label = ref('')
const tags = ref<Array<string>>(props.initialTags.map((t) => t.label))
const highlightedTagIndex = ref<number | null>(null)

const suggestions = computed<Array<TaskTag>>(() => {
  return props.suggestions.filter((s) => !tags.value.includes(s.label))
})

// Focus input field when the main container is clicked
const focusInput = (event: MouseEvent) => {
  const input = inputRef.value as HTMLInputElement
  input.focus()
  popover.value?.show(event)
}

// Add a tag when the spacebar or enter key is pressed
const addTag = (value: string) => {
  const tagLabel = value.trim()
  const suggested = suggestions.value.find((s) => s.label === tagLabel)

  if (suggested) {
    tags.value.push(suggested.label)
  } else if (tagLabel) {
    props.onCreateTag(tagLabel)
    tags.value.push(tagLabel)
  }

  label.value = ''
  highlightedTagIndex.value = null
}

// Handle backspace when the input is empty
const handleBackspace = () => {
  if (label.value === '') {
    if (highlightedTagIndex.value === null) {
      highlightedTagIndex.value = tags.value.length - 1
    } else {
      // Delete the highlighted tag if backspace is pressed again
      tags.value.splice(highlightedTagIndex.value, 1)
      highlightedTagIndex.value = null
    }
  }
}

// Handle left and right arrow keys to highlight previous or next tag
const handleArrowNavigation = (event: KeyboardEvent) => {
  if (label.value !== '' || tags.value.length === 0) return

  switch (event.key) {
    case 'ArrowLeft': {
      if (highlightedTagIndex.value === null) {
        highlightedTagIndex.value = tags.value.length - 1
      } else if (highlightedTagIndex.value > 0) {
        highlightedTagIndex.value--
      }
      break
    }

    case 'ArrowRight': {
      if (highlightedTagIndex.value !== null && highlightedTagIndex.value < tags.value.length - 1) {
        highlightedTagIndex.value++
      } else {
        highlightedTagIndex.value = null
      }
      break
    }
    // no default
  }
}

watch(suggestions, async (latest) => {
  if (latest.length === 0) {
    return popover.value?.hide()
  } else if (document.activeElement === inputRef.value) {
    await nextTick()
    return popover.value?.show({ currentTarget: inputRef.value } as FocusEvent)
  }
})

watch(tags, (latest) => {
  props.onChange(props.suggestions.filter((s) => latest.includes(s.label)))
})
</script>

<template>
  <div class="s-tagsinput-box" @click="focusInput">
    <div class="s-tags">
      <Tag
        v-for="(tag, index) in tags"
        severity="info"
        :key="index"
        :class="['s-tag', { 'is-highlighted': index === highlightedTagIndex }]"
      >
        #{{ tag }}
      </Tag>

      <label :for="ids.tags_input" class="p-hidden-accessible">Enter tags</label>

      <input
        :id="ids.tags_input"
        type="text"
        ref="inputRef"
        class="s-tagsinput"
        v-model="label"
        :placeholder="tags.length === 0 ? '#Tags' : undefined"
        @focus="popover?.show({ currentTarget: inputRef } as FocusEvent)"
        @keydown.space.prevent="addTag(label)"
        @keydown.enter.prevent="addTag(label)"
        @keydown.backspace="handleBackspace"
        @keydown.left="handleArrowNavigation"
        @keydown.right="handleArrowNavigation"
      />
    </div>

    <Popover
      v-if="suggestions.length"
      ref="popover"
      class="s-tagsinput-popover"
      :append-to="inputRef?.parentElement"
    >
      <span class="s-popover-label">Suggested Tags</span>
      <Listbox
        class="s-tagsinput-listbox"
        v-model="tags"
        :options="suggestions"
        :multiple="true"
        option-value="label"
      >
        <template #option="{ option }">
          <span style="font-weight: 500; line-height: 1">#{{ option.label }}</span>
        </template>
      </Listbox>
    </Popover>
  </div>
</template>

<style scoped>
.s-tagsinput-box {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  cursor: text;
  height: 25px;
}

.s-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.s-tag {
  padding-block: 0;
  padding-inline: 0.175rem;
  margin-inline: 0.1rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  background-color: transparent;
}

.s-tag.is-highlighted {
  background-color: var(--p-tag-info-background);
}

.s-tagsinput {
  border: none;
  outline: none;
  padding: 0px;
  min-width: 50px;
  flex: 1 1 auto;
  background-color: transparent;
}

/* Ensure the input and tags wrap correctly */
.s-tagsinput-box,
.s-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.s-tags .s-tagsinput {
  flex: 1 1 auto;
}

.s-popover-label {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem;
  color: var(--s-script-secondary);
  margin-block-end: 0.5rem;
}

.s-tagsinput-listbox {
  background-color: transparent;
  border: 0;
  box-shadow: none;
}
</style>

<style>
.p-popover.s-tagsinput-popover {
  background: rgba(var(--s-surface-through-rgb) / var(--s-surface-through-alpha));
  backdrop-filter: blur(10px);
  filter: saturate(180%);
  min-width: 250px;
  padding: 0;
}

.p-popover.s-tagsinput-popover > .p-popover-content {
  padding-inline: 0.25rem;
  padding-block-end: 0.25em;
}

.s-tagsinput-listbox li {
  padding: 0.25em 0.5em;
}

.s-tagsinput-listbox li {
  --p-listbox-option-focus-background: var(--p-primary-color);
  --p-listbox-option-focus-color: var(--p-primary-contrast-color);
}
</style>
