<script setup lang="ts">
import { type StyleValue, computed, reactive, ref, watch } from 'vue'

import { setCaretToPoint } from '@/utils/dom'

type Point = { x: number; y: number }
type EditableTextEvent<T extends Event> = {
  [P in keyof T]: T[P] extends EventTarget | null ? HTMLDivElement : T[P]
}

type EditableTextEmits = {
  focus: [event: EditableTextEvent<FocusEvent>]
  blur: [event: EditableTextEvent<FocusEvent>]
  input: [event: EditableTextEvent<Event>]
  click: [event: EditableTextEvent<MouseEvent>]
  modify: [event: string]
}

interface EditableTextProps {
  autoFocus?: boolean
  text: string
  placeholder?: string
  lines?: number
  multiline?: boolean
}

const props = withDefaults(defineProps<EditableTextProps>(), {
  autoFocus: false,
  placeholder: 'Enter text...',
  multiline: false,
})

const emit = defineEmits<EditableTextEmits>()

const editableText = ref<HTMLDivElement | null>(null)
const editable = ref<boolean>(props.autoFocus)
const hasText = ref(!!props.text)
const value = ref(props.text)
const point = reactive<Point>({ x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY })

const style = computed((): StyleValue => {
  const isEditable = editable.value === true
  return {
    '--lines': props.lines,
    display: isEditable ? undefined : '-webkit-box',
    overflow: isEditable ? 'auto' : 'hidden',
    'user-select': isEditable ? 'text' : 'none',
    'white-space': props.multiline ? 'pre-wrap' : undefined,
    'line-clamp': isEditable ? undefined : props.lines,
    '-webkit-line-clamp': isEditable ? undefined : props.lines,
    '-webkit-box-orient': isEditable ? undefined : 'vertical',
  }
})

const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return
  const target = event.target as HTMLDivElement | null
  event.preventDefault()

  if (props.multiline === true) {
    document.execCommand('insertLineBreak')
    return
  }

  target?.blur()
}

const handleEditableBlur = (event: FocusEvent) => {
  const target = event.target as HTMLElement | null
  const relatedTarget = event.relatedTarget as HTMLElement | null

  // ***************************************************************
  // If the editable document was blurred but still remains the
  // active element, then it's most likely the browser window or the
  // client area lost focus, not necessarily the editable document
  // ***************************************************************
  if (relatedTarget === null && document.activeElement === target) return

  editable.value = false
  editableText.value?.scrollTo({ top: 0 })
  emit('blur', event as unknown as EditableTextEvent<FocusEvent>)
}

const handleFocus = (event: FocusEvent) => {
  // ***************************************************************
  // Defer contenteditable region focus, by either TAB key or click,
  // handler by 150ms to allow the click event action to execute
  // before it and collect data required for the computation of the
  // caret postion in the eidtable document based on the mouse event
  // `clientX` and `clientY`.
  // ***************************************************************
  setTimeout(() => {
    editable.value = true
    emit('focus', event as unknown as EditableTextEvent<FocusEvent>)
  }, 150)
}

function handleClick(event: MouseEvent) {
  // ***************************************************************
  // Set point in document that was clicked and use it later to
  // compute caret position of focused editabled document.
  //
  // Since a click will also trigger a focus on a tabbable element,
  // and a focus provides no information where the caret should be
  // placed in the editable document, this ensures that when an
  // editable document is focused by a click, we can preserve the
  // caret position still.
  // ***************************************************************
  point.x = event.clientX
  point.y = event.clientY

  emit('click', event as unknown as EditableTextEvent<MouseEvent>)
}

function handleInput(event: Event) {
  value.value = editableText.value?.textContent ?? ''
  value.value ? (hasText.value = true) : (hasText.value = false)
  emit('input', event as unknown as EditableTextEvent<Event>)
}

function handlePaste(event: ClipboardEvent) {
  // ***************************************************************
  // 1. Ensure rich text cannot be pasted into the editable document
  // 2. Ensure newline characters are replaced with space if
  //    `props.multiline` is `false`
  // ***************************************************************
  let text = event.clipboardData?.getData('text') ?? ''
  if (props.multiline === false) text = text.replace(/\n|\r|\r\n/, ' ')
  document.execCommand('insertText', false, text)
}

function resetPoint() {
  point.x = Number.NEGATIVE_INFINITY
  point.y = Number.NEGATIVE_INFINITY
}

watch(props, (latest) => (hasText.value = !!latest.text))

watch(editable, (isEditable) => {
  // ***************************************************************
  // Whenever any of the editable documents becomes active, ensure
  // input caret is properly placed.
  // ***************************************************************
  if (isEditable) {
    queueMicrotask(() => {
      setCaretToPoint(editableText.value, point)
      resetPoint()
    })
  } else {
    // ***************************************************************
    // Ensure that editable value is checked for changes to undefined
    // only after the focus handler has run.
    //
    // The value is set to undefined whenever the editable document
    // is blurred, and will only stay undefined if the reason for
    // the onblur triggered wasn't because another editable document
    // of interest received focus, and that state would take about
    // 150ms, after the actual event, to be registered, so we have to
    // delay this for more than 150ms.
    //
    // Why we do this is because if we accidentally saved a task
    // without a title, it would get removed, and we don't want to
    // accidentally remove newly added to-dos in between a user
    // filling out the to-do fields.
    // ***************************************************************
    setTimeout(() => {
      emit('modify', value.value.trim())
    }, 200)
  }
})
</script>

<template>
  <div
    ref="editableText"
    :class="['s-editable-text', { 's-editable-empty': !hasText }]"
    :contenteditable="editable"
    :role="editable ? 'textarea' : undefined"
    :data-placeholder="placeholder"
    :style="style"
    tabindex="0"
    @blur="handleEditableBlur"
    @click="handleClick"
    @focus="handleFocus"
    @input="handleInput"
    @paste.prevent="handlePaste"
    @keydown.enter.capture.stop="handleEnterKey"
    @dblclick.stop=""
  >
    {{ value }}
  </div>
</template>

<style scoped>
.s-editable-text {
  --line-height: 1.6;
  outline: none;
  width: fit-content;
  min-width: 100px;
  position: relative;
  overflow-y: auto;
  max-height: calc(1rem * var(--line-height) * var(--lines, 20));

  &[contenteditable='true']:focus {
    outline: none;
  }
}

.s-editable-empty::before {
  content: attr(data-placeholder);
  display: inline-block;
  pointer-events: none;
  font-size: inherit;
  font-weight: inherit;
  font-style: oblique;
  color: var(--s-script-subtle);
}
</style>
