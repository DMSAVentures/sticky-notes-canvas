import { useState, useEffect, MouseEvent, WheelEvent, RefObject } from 'react'
import { ViewState } from '../types'

interface UseCanvasStateProps {
    canvasRef: RefObject<HTMLDivElement>
    viewState: ViewState
    setViewState: (viewState: ViewState | ((prev: ViewState) => ViewState)) => void
}

export function useCanvasState({ canvasRef, viewState, setViewState }: UseCanvasStateProps) {
    const [isPanning, setIsPanning] = useState(false)
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })

    // Handle mouse down for panning
    const handleMouseDown = (e: MouseEvent) => {
        // Only pan if clicking on canvas, not on notes
        if (e.target === e.currentTarget && e.button === 0) {
            setIsPanning(true)
            setStartPan({ x: e.clientX - viewState.x, y: e.clientY - viewState.y })
            e.preventDefault()
        }
    }

    // Handle mouse move for panning
    const handleMouseMove = (e: MouseEvent) => {
        if (isPanning) {
            setViewState(prev => ({
                ...prev,
                x: e.clientX - startPan.x,
                y: e.clientY - startPan.y
            }))
        }
    }

    // Handle mouse up to stop panning
    const handleMouseUp = () => {
        setIsPanning(false)
    }

    // Handle wheel for zooming
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY * -0.001
        const newZoom = Math.min(Math.max(0.1, viewState.zoom + delta), 5)

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

    // Reset view to default
    const resetView = () => {
        setViewState({ x: 0, y: 0, zoom: 1 })
    }

    // Add global mouse up listener
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsPanning(false)
        window.addEventListener('mouseup', handleGlobalMouseUp)
        window.addEventListener('mouseleave', handleGlobalMouseUp)

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp)
            window.removeEventListener('mouseleave', handleGlobalMouseUp)
        }
    }, [])

    // Calculate grid properties
    const baseGridSize = 20
    const gridStep = Math.pow(2, Math.floor(Math.log2(viewState.zoom)))
    const gridSize = baseGridSize / gridStep
    const minGridOpacity = 0.05
    const maxGridOpacity = 0.15
    const gridOpacity = Math.min(maxGridOpacity, Math.max(minGridOpacity, 0.1 * viewState.zoom))

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