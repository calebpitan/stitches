type Point = { x: number; y: number }

type CaretPosition = { offset: number; offsetNode: Node }
type CaretRangeFromPoint = (this: Document, x: number, y: number) => Range | null
type CaretPositionFromPoint = (this: Document, x: number, y: number) => CaretPosition | null

const isCaret____FromPoint = (f: any): f is CaretRangeFromPoint | CaretPositionFromPoint =>
  typeof f === 'function'

const isCaretPositionFromPoint = (
  f: CaretRangeFromPoint | CaretPositionFromPoint
): f is CaretPositionFromPoint => 'caretPositionFromPoint' in document

export function setCaretToPoint<E extends HTMLElement, P extends Point>(
  element: E | null,
  point: P
) {
  if (!element) return

  const range = document.createRange()
  const selection = window.getSelection()

  const commit = (s: Selection, r: Range) => {
    s.removeAllRanges()
    s.addRange(r)
  }

  const isSafePoint = Number.isFinite(point.x) && Number.isFinite(point.y)
  const caretPositionOrRangeFromPoint: unknown =
    'caretPositionFromPoint' in document
      ? document.caretPositionFromPoint
      : document.caretRangeFromPoint

  // ***************************************************************
  // Calling the function, `caretPositionFromPoint`, directly would
  // fail becuase assigning it to a variable outside of the document
  // context changes the function's internal context and must be
  // bound back using either `bind`, `call` or `apply`.
  // ***************************************************************
  const position =
    isSafePoint && isCaret____FromPoint(caretPositionOrRangeFromPoint)
      ? isCaretPositionFromPoint(caretPositionOrRangeFromPoint)
        ? caretPositionOrRangeFromPoint.call(document, point.x, point.y)
        : caretPositionOrRangeFromPoint.call(document, point.x, point.y)
      : null

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
  if (!isSafePoint || !position) {
    return void (selection && commit(selection, range))
  }

  if ('offsetNode' in position) {
    range.setStart(position.offsetNode, position.offset)
  } else {
    range.setStart(position.startContainer, position.startOffset)
    range.setEnd(position.endContainer, position.endOffset)
  }

  return void (selection && commit(selection, range))
}
