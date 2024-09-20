<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

type Point = { x: number; y: number }
type EditableTextEvent<T extends Event> = {
  [P in keyof T]: T[P] extends EventTarget | null ? HTMLDivElement : T[P]
}
interface EditableTextProps {
  initialActive?: boolean
  text: string
  placeholder?: string
  lines?: number
  focusControlEl?: HTMLElement
  onFocus?: (event: EditableTextEvent<FocusEvent>) => void
  onBlur?: (event: EditableTextEvent<FocusEvent>) => void
  onInput?: (event: EditableTextEvent<Event>) => void
  onClick?: (event: EditableTextEvent<MouseEvent>) => void
  onModify?: (text: string) => void
}

const props = withDefaults(defineProps<EditableTextProps>(), {
  initialActive: false,
  lines: 1,
  placeholder: 'Enter text...'
})

const editableText = ref<HTMLDivElement | null>(null)
const editable = ref<boolean>(props.initialActive)
const hasText = ref(!!props.text)
const point = reactive<Point>({ x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY })

const handleEditableBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement | null

  if (relatedTarget === null) return
  if (relatedTarget === props.focusControlEl) return editableText.value?.focus()

  editable.value = false
  editableText.value?.scrollTo({ top: 0 })
  props.onBlur?.(event as unknown as EditableTextEvent<FocusEvent>)
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
    props.onFocus?.(event as unknown as EditableTextEvent<FocusEvent>)
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

  props.onClick?.(event as unknown as EditableTextEvent<MouseEvent>)
}

function handleInput(event: Event) {
  editableText.value?.textContent ? (hasText.value = true) : (hasText.value = false)
  props.onInput?.(event as unknown as EditableTextEvent<Event>)
}

function handlePaste(event: ClipboardEvent) {
  // Ensure rich text cannot be pasted into the editable document.
  const text = event.clipboardData?.getData('text') ?? ''
  document.execCommand('insertText', false, text)
}

function resetPoint() {
  point.x = Number.NEGATIVE_INFINITY
  point.y = Number.NEGATIVE_INFINITY
}

function setCaretToPoint(element: HTMLElement | null, point: Point) {
  if (!element) return

  const range = document.createRange()
  const selection = window.getSelection()
  const position = document.caretRangeFromPoint(point.x, point.y)
  const isSafePoint = Object.values(point).some((p) => Number.isFinite(p))

  // ***************************************************************
  // If the point is not a safe point, then focus was more likely a
  // keyboard or programmatic focus than other
  // input-sources-triggered focus.
  //
  // A safe point has finite, decimal coordinates
  // ***************************************************************
  if (!isSafePoint) {
    // Move range to the end of the content
    range.selectNodeContents(element)
    // range.collapse(false)
  }

  // ***************************************************************
  // If the point is a safe point, then focus was more likely one
  // triggered by other input sources than a keyboard or
  // programmatic focus.
  // ***************************************************************
  if (isSafePoint && position) {
    range.setStart(position.startContainer, position.startOffset)
    range.setEnd(position.endContainer, position.endOffset)
  }

  selection?.removeAllRanges()
  selection?.addRange(range)
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
    // Why we do this is because if we accidentally saved a todo
    // without a title, it would get removed, and we don't want to
    // accidentally remove newly added to-dos in between a user
    // filling out the to-do fields.
    // ***************************************************************
    setTimeout(() => {
      props.onModify?.(editableText.value!.textContent!.trim())
    }, 200)
  }
})
</script>

<template>
  <div
    ref="editableText"
    :class="['s-editable-text', { 's-editable-empty': !hasText }]"
    :contenteditable="editable"
    :role="editable ? 'textarea' : 'generic'"
    :data-placeholder="placeholder"
    :style="{
      overflow: editable ? 'auto' : 'hidden',
      userSelect: editable ? 'auto' : 'none',
      lineClamp: editable ? undefined : lines,
      '-webkit-line-clamp': editable ? undefined : lines
    }"
    tabindex="0"
    @blur="handleEditableBlur"
    @click="handleClick"
    @focus="handleFocus"
    @input="handleInput"
    @paste.prevent="handlePaste"
    @dblclick.stop=""
  >
    {{ text }}
  </div>
</template>

<style scoped>
.s-editable-text {
  position: relative;
  width: fit-content;
  outline: none;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.s-editable-text[contenteditable='true']:focus {
  outline: none;
}

.s-editable-empty::before {
  content: attr(data-placeholder);
  display: block;
  font-size: inherit;
  font-weight: inherit;
  font-style: oblique;
  color: var(--s-script-subtle);
}
</style>
