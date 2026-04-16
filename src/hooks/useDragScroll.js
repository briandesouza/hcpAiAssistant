import { useCallback, useEffect, useRef, useState } from 'react'

export default function useDragScroll(direction = 'vertical') {
  const [node, setNode] = useState(null)
  const state = useRef({
    isDragging: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    scrollStartX: 0,
    scrollStartY: 0,
  })

  const THRESHOLD = 5
  const HORIZONTAL_DRAG_MULTIPLIER = 1.35
  const setRef = useCallback((el) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (!node) return

    function onMouseDown(e) {
      if (e.button !== 0) return
      if (direction === 'horizontal') e.preventDefault()

      const s = state.current
      s.isDragging = false
      s.didDrag = false
      s.startX = e.clientX
      s.startY = e.clientY
      s.scrollStartX = node.scrollLeft
      s.scrollStartY = node.scrollTop

      document.body.style.userSelect = 'none'

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    function onMouseMove(e) {
      const s = state.current
      const dx = e.clientX - s.startX
      const dy = e.clientY - s.startY

      if (!s.isDragging) {
        const dist = direction === 'vertical' ? Math.abs(dy) : Math.abs(dx)
        if (dist < THRESHOLD) return
        s.isDragging = true
        node.style.cursor = 'grabbing'
      }

      if (direction === 'vertical') {
        node.scrollTop = s.scrollStartY - dy
      } else {
        node.scrollLeft = s.scrollStartX - (dx * HORIZONTAL_DRAG_MULTIPLIER)
      }
    }

    function onMouseUp() {
      const s = state.current

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      node.style.cursor = ''
      document.body.style.userSelect = ''

      if (s.isDragging) {
        s.didDrag = true
        setTimeout(() => { s.didDrag = false }, 0)
      }

      s.isDragging = false
    }

    function onClickCapture(e) {
      if (state.current.didDrag) {
        e.stopPropagation()
        e.preventDefault()
        state.current.didDrag = false
      }
    }

    function onWheel(e) {
      if (e.deltaY !== 0) {
        e.preventDefault()
        node.scrollLeft += e.deltaY
      }
    }

    node.addEventListener('mousedown', onMouseDown)
    node.addEventListener('click', onClickCapture, true)

    if (direction === 'horizontal') {
      node.addEventListener('wheel', onWheel, { passive: false })
    }

    return () => {
      node.removeEventListener('mousedown', onMouseDown)
      node.removeEventListener('click', onClickCapture, true)
      if (direction === 'horizontal') {
        node.removeEventListener('wheel', onWheel)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      node.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [direction, node, HORIZONTAL_DRAG_MULTIPLIER])

  return setRef
}
