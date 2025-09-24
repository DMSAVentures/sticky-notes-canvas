import { useState, useEffect, MouseEvent, WheelEvent, RefObject } from 'react'
import { ViewState } from '../types'
import {
    CANVAS_ZOOM_MIN,
    CANVAS_ZOOM_MAX,
    CANVAS_ZOOM_WHEEL_FACTOR,
    CANVAS_BASE_GRID_SIZE,
    CANVAS_GRID_OPACITY_MIN,
    CANVAS_GRID_OPACITY_MAX
} from '../constants'

interface UseCanvasStateProps {
    canvasRef: RefObject<HTMLDivElement | null>
    viewState: ViewState
    setViewState: (viewState: ViewState | ((prev: ViewState) => ViewState)) => void
}

export function useCanvasState({ canvasRef, viewState, setViewState }: UseCanvasStateProps) {
    const [isPanning, setIsPanning] = useState(false)
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })

    const handleMouseDown = (e: MouseEvent) => {
        // Only pan if clicking on canvas background, not on notes
        if (e.target === e.currentTarget && e.button === 0) {
            setIsPanning(true)
            setStartPan({ x: e.clientX - viewState.x, y: e.clientY - viewState.y })
            e.preventDefault()
        }
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (isPanning) {
            setViewState(prev => ({
                ...prev,
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            }))
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
    }

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY * -CANVAS_ZOOM_WHEEL_FACTOR
        const newZoom = Math.min(Math.max(CANVAS_ZOOM_MIN, viewState.zoom + delta), CANVAS_ZOOM_MAX)

        // Zoom towards mouse position
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const zoomRatio = newZoom / viewState.zoom

            setViewState(prev => ({
                x: prev.x - (x - prev.x) * (zoomRatio - 1),
                y: prev.y - (y - prev.y) * (zoomRatio - 1),
                zoom: newZoom
            }))
        }
    }

    const resetView = () => {
        setViewState({ x: 0, y: 0, zoom: 1 })
    }

    // Global listeners to handle mouse release outside canvas
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsPanning(false)
        window.addEventListener('mouseup', handleGlobalMouseUp)
        window.addEventListener('mouseleave', handleGlobalMouseUp)

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp)
            window.removeEventListener('mouseleave', handleGlobalMouseUp)
        }
    }, [])

    // Dynamic grid scaling: doubles/halves at power-of-2 zoom levels
    const gridStep = Math.pow(2, Math.floor(Math.log2(viewState.zoom)))
    const gridSize = CANVAS_BASE_GRID_SIZE / gridStep
    const gridOpacity = Math.min(
        CANVAS_GRID_OPACITY_MAX,
        Math.max(CANVAS_GRID_OPACITY_MIN, 0.25 * viewState.zoom)
    )

    return {
        isPanning,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        resetView,
        gridSize,
        gridOpacity
    }
}