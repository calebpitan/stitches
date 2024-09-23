<script setup lang="ts">
import type { TodoListItem } from '@/interfaces/todo'
import { computed, onMounted, reactive, ref, watch } from 'vue'

type Field = 'title' | 'desc'
type Point = { x: number; y: number }
interface TodoPresentationProps {
  todo: TodoListItem
  onToggle?: (id: string, completed: boolean) => void
  onReview?: (id: string, patch: Partial<Pick<TodoListItem, 'title' | 'summary'>>) => void
  onDelete?: (id: string) => void
}

const props = defineProps<TodoPresentationProps>()

const point = reactive<Point>({ x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY })
const completed = ref(props.todo.completed ?? false)
const titleRef = ref<HTMLElement | null>(null)
const descRef = ref<HTMLElement | null>(null)
const titleRefHasText = ref(!!props.todo.title)
const descRefHasText = ref(!!props.todo.summary)

const editable = ref<Field | undefined>(undefined)
const titleIsEditable = computed(() => editable.value === 'title')
const descIsEditable = computed(() => editable.value === 'desc')

const createFocusHandler = (field: Field) => {
  const handler = (_event: FocusEvent) => {
    // ***************************************************************
    // Defer contenteditable region focus, by either TAB key or click,
    // handler by 150ms to allow the click event action to execute
    // before it and collect data required for the computation of the
    // caret postion in the eidtable document based on the mouse event
    // `clientX` and `clientY`.
    // ***************************************************************
    setTimeout(() => {
      editable.value = field
    }, 150)
  }

  return handler
}

const handleDescFocus = createFocusHandler('desc')
const handleTitleFocus = createFocusHandler('title')

const handleEditableBlur = (event: FocusEvent) => {
  const addTodoButtonId = 'new-todo-button'
  const relatedTarget = event.relatedTarget as HTMLElement | null

  if (relatedTarget === null) return
  if (relatedTarget.getAttribute('id') === addTodoButtonId) return titleRef.value?.focus()

  editable.value = undefined
  titleRef.value?.scrollTo({ top: 0 })
  descRef.value?.scrollTo({ top: 0 })
}

function handleInput(field: Field) {
  switch (field) {
    case 'title':
      titleRef.value?.textContent ? (titleRefHasText.value = true) : (titleRefHasText.value = false)
      break
    case 'desc':
      descRef.value?.textContent ? (descRefHasText.value = true) : (descRefHasText.value = false)
      break
    // no default
  }
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

watch(completed, (latest) => props.onToggle?.(props.todo.id, latest))

watch(editable, (latest) => {
  // ***************************************************************
  // Whenever any of the editable documents becomes active, ensure
  // input caret is properly placed.
  // ***************************************************************
  switch (latest) {
    case 'desc':
      queueMicrotask(() => {
        setCaretToPoint(descRef.value, point)
        resetPoint()
      })
      break

    case 'title':
      queueMicrotask(() => {
        setCaretToPoint(titleRef.value, point)
        resetPoint()
      })
      break

    default:
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
        editable.value === undefined &&
          props.onReview?.(props.todo.id, {
            title: titleRef.value!.textContent!,
            summary: descRef.value!.textContent!
          })
      }, 200)

      break
  }
})

onMounted(() => {
  // Whenever a todo presentation is mounted with an empty title, focus it.
  if (!props.todo.title) {
    editable.value = 'title'
    titleRef.value?.focus()
  }
})
</script>

<template>
  <div class="s-todo-presentation" v-focustrap>
    <div class="s-todo-controls">
      <Checkbox v-model="completed" :name="todo.title" :aria-label="todo.title" binary />
    </div>

    <div class="s-todo-contents">
      <div
        ref="titleRef"
        :class="{ 's-todo-title': true, 's-title-editable': !titleRefHasText }"
        :contenteditable="titleIsEditable"
        :role="titleIsEditable ? 'textarea' : 'generic'"
        :style="{
          overflow: titleIsEditable ? 'auto' : 'hidden',
          userSelect: titleIsEditable ? 'auto' : 'none',
          lineClamp: titleIsEditable ? undefined : 1,
          '-webkit-line-clamp': titleIsEditable ? undefined : 1
        }"
        tabindex="0"
        data-placeholder="Title"
        @blur="handleEditableBlur"
        @click="handleClick"
        @focus="handleTitleFocus"
        @input="handleInput('title')"
        @paste.prevent="handlePaste"
        @dblclick.stop=""
      >
        {{ todo.title }}
      </div>

      <div
        ref="descRef"
        :class="{ 's-todo-desc': true, 's-desc-editable': !descRefHasText }"
        :contenteditable="descIsEditable"
        :role="descIsEditable ? 'textarea' : 'generic'"
        :style="{
          overflow: descIsEditable ? 'auto' : 'hidden',
          userSelect: descIsEditable ? 'auto' : 'none',
          lineClamp: descIsEditable ? undefined : 3,
          '-webkit-line-clamp': descIsEditable ? undefined : 3
        }"
        tabindex="0"
        data-placeholder="summary..."
        @blur="handleEditableBlur"
        @click="handleClick"
        @focus="handleDescFocus"
        @input="handleInput('desc')"
        @paste.prevent="handlePaste"
        @dblclick.stop=""
      >
        {{ todo.summary }}
      </div>
    </div>

    <div class="s-todo-actions">
      <Button
        aria-label="Delete"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        :text="true"
        :rounded="true"
        @click="onDelete?.(todo.id)"
      />
    </div>
  </div>
</template>

<style scoped>
.s-todo-presentation {
  display: flex;
  align-items: center;
  width: 100%;
  flex: 1 1 100%;
  padding: 1rem 0.375rem;
  border-radius: 0.375rem;
  /* background-color: var(--s-surface-middle); */
}

.s-todo-controls,
.s-todo-contents {
  display: flex;
  flex-direction: column;
}

.s-todo-contents {
  margin-inline-start: 1rem;
  width: 100%;
}

.s-todo-title {
  font-weight: 600;
  max-height: calc(1.6em * 1);
}

.s-todo-desc {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--s-script-secondary);
  max-height: calc(1.6em * 3);
}

.s-todo-title,
.s-todo-desc {
  position: relative;
  width: fit-content;
  outline: none;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.s-todo-title[contenteditable='true']:focus,
.s-todo-desc[contenteditable='true']:focus {
  outline: none;
}

.s-todo-actions {
  display: flex;
  flex-direction: column;
  opacity: 0.3;
  visibility: hidden;
  transition: opacity 0.4s ease-in;
}

.s-todo-presentation:hover .s-todo-actions {
  /* .s-todo-presentation:focus-within .s-todo-actions { */
  opacity: 1;
  visibility: visible;
}

.s-title-editable::before,
.s-desc-editable::before {
  content: attr(data-placeholder);
  display: block;
  font-size: inherit;
  font-weight: inherit;
  font-style: oblique;
  color: var(--s-script-subtle);
}
</style>
