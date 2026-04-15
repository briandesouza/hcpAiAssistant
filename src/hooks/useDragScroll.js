import { useRef, useEffect } from 'react'

export default function useDragScroll(direction = 'vertical') {
  const elRef = useRef(null)
  const state = useRef({
    isDragging: false,
    didDrag: false,
    startX: 0,
    startY: 0,
    scrollStartX: 0,
    scrollStartY: 0,
  })

  const THRESHOLD = 5

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    function onMouseDown(e) {
      if (e.button !== 0) return

      const s = state.current
      s.isDragging = false
      s.didDrag = false
      s.startX = e.clientX
      s.startY = e.clientY
      s.scrollStartX = el.scrollLeft
      s.scrollStartY = el.scrollTop

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
        el.style.cursor = 'grabbing'
      }

      if (direction === 'vertical') {
        el.scrollTop = s.scrollStartY - dy
      } else {
        el.scrollLeft = s.scrollStartX - dx
      }
    }

    function onMouseUp() {
      const s = state.current

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      el.style.cursor = ''
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
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('click', onClickCapture, true)

    if (direction === 'horizontal') {
      el.addEventListener('wheel', onWheel, { passive: false })
    }

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('click', onClickCapture, true)
      if (direction === 'horizontal') {
        el.removeEventListener('wheel', onWheel)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.userSelect = ''
    }
  }, [direction])

  return elRef
}
