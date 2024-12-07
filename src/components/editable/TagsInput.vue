<script
  setup
  lang="ts"
  generic="T extends Record<string, any>, L extends keyof T, V extends keyof T"
>
import { type Ref, computed, nextTick, ref, useId, watch } from 'vue'

import { isFn } from '@stitches/common'

import Popover from 'primevue/popover'

export interface TagsInputProps<
  T extends Record<string, any>,
  K extends keyof T,
  V extends keyof T,
> {
  tags?: T[]
  suggestions?: T[]
  tagLabel?: K | ((v?: T) => T[K])
  tagValue?: V | ((v?: T) => T[V])
}

type TagsInputEmits<T> = {
  create: [label: string]
  add: [tag: T]
  remove: [tag: T]
  change: [tags: T[]]
}

const props = withDefaults(defineProps<TagsInputProps<T, L, V>>(), {
  tags: () => [],
  suggestions: () => [],
  tagLabel: (t?: T) => t?.['label'] as T[L],
  tagValue: (t?: T) => t?.['value'] as T[V],
})

const emit = defineEmits<TagsInputEmits<T>>()

const IDs = { TagsInput: useId() }

const getTagLabel = (tag: T) => (isFn(props.tagLabel) ? props.tagLabel(tag) : tag[props.tagLabel])
// const getTagValue = (tag?: T) => isFn(props.tagValue) ? props.tagValue(tag) : tag[props.tagValue]
const evaluateLabels = (tags: T[]) => tags.map((t) => getTagLabel(t))

const inputRef = ref<HTMLInputElement | null>(null)
const popover = ref<InstanceType<typeof Popover> | null>(null)

const text = ref('')
const labels = ref(evaluateLabels(props.tags)) as Ref<T[L][]>
const indexOfHighlightedTag = ref<number | null>(null)

const suggestions = computed<Array<T>>(() => {
  return props.suggestions.filter((s) => !labels.value.includes(getTagLabel(s)))
})

function focusInput(event: MouseEvent) {
  // Focus input field when the main container is clicked
  const input = inputRef.value as HTMLInputElement
  input.focus()
  popover.value?.show(event)
}

function createTag(label: string) {
  // Add a tag when the spacebar or enter key is pressed
  if (label.trim() === '') return
  emit('create', label.trim())

  text.value = ''
  indexOfHighlightedTag.value = null
}

function handleBackspace() {
  // Handle backspace when the input is empty
  if (text.value !== '') return
  if (indexOfHighlightedTag.value === null) {
    indexOfHighlightedTag.value = labels.value.length - 1
  } else {
    // Delete the highlighted tag if backspace is pressed again
    const removedLabel = labels.value.splice(indexOfHighlightedTag.value, 1).at(0)
    const removedTag = props.tags.find((t) => removedLabel && getTagLabel(t) === removedLabel)

    removedTag !== undefined && emit('remove', removedTag)
    indexOfHighlightedTag.value = null
  }
}

function handleArrowNavigation(event: KeyboardEvent) {
  // Handle left and right arrow keys to highlight previous or next tag
  if (text.value !== '' || labels.value.length === 0) return

  switch (event.key) {
    case 'ArrowLeft': {
      if (indexOfHighlightedTag.value === null) {
        indexOfHighlightedTag.value = labels.value.length - 1
      } else if (indexOfHighlightedTag.value > 0) {
        indexOfHighlightedTag.value--
      }
      break
    }

    case 'ArrowRight': {
      if (
        indexOfHighlightedTag.value !== null &&
        indexOfHighlightedTag.value < labels.value.length - 1
      ) {
        indexOfHighlightedTag.value++
      } else {
        indexOfHighlightedTag.value = null
      }
      break
    }
    // no default
  }
}

watch(
  () => props.tags,
  (tags) => (labels.value = evaluateLabels(tags)),
)
watch(suggestions, async (latest) => {
  if (latest.length === 0) {
    return popover.value?.hide()
  } else if (document.activeElement === inputRef.value) {
    await nextTick()
    return popover.value?.show({ currentTarget: inputRef.value } as FocusEvent)
  }
})

// when `onChange` is emitted, consumer should figure out how to use the changed value
// and to add a tag to a task from it.

watch(labels, (newLabels, prevLabels) => {
  const newLabelsSet = new Set(newLabels)
  const prevLabelsSet = new Set(prevLabels)
  const addedLabel = newLabels.find((n) => !prevLabelsSet.has(n))
  const removedLabel = prevLabels.find((p) => !newLabelsSet.has(p))
  const addedTag = props.suggestions.find((t) => addedLabel && getTagLabel(t) === addedLabel)
  const removedTag = props.tags.find((t) => removedLabel && getTagLabel(t) === removedLabel)
  const selectedTags = props.suggestions.filter((s) => newLabelsSet.has(getTagLabel(s)))

  !!addedTag && emit('add', addedTag)
  !!removedTag && emit('remove', removedTag)

  emit('change', selectedTags)
})
</script>

<template>
  <div class="s-tagsinput-box" @click="focusInput">
    <div class="s-tags">
      <Tag
        v-for="(tag, index) in labels"
        severity="info"
        :key="index"
        :class="['s-tag', { 'is-highlighted': index === indexOfHighlightedTag }]"
      >
        #{{ tag }}
      </Tag>

      <label :for="IDs.TagsInput" class="p-hidden-accessible">Enter tags</label>

      <input
        :id="IDs.TagsInput"
        type="text"
        ref="inputRef"
        class="s-tagsinput"
        autocomplete="false"
        autocapitalize="false"
        autocorrect="false"
        v-model="text"
        :placeholder="labels.length === 0 ? '#Tags' : undefined"
        @focus="popover?.show({ currentTarget: inputRef } as FocusEvent)"
        @keydown.space.prevent="createTag(text)"
        @keydown.enter.prevent="createTag(text)"
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
        v-model="labels"
        :options="suggestions"
        :multiple="true"
        :option-value="getTagLabel"
      >
        <template #option="{ option }: { option: T }">
          <span style="font-weight: 500; line-height: 1">#{{ getTagLabel(option) }}</span>
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
