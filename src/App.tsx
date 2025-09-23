import { useRef, useState, useEffect, MouseEvent, WheelEvent } from 'react'
import styles from './App.module.css'

interface ViewState {
    x: number
    y: number
    zoom: number
}

export function App() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })
    const [isPanning, setIsPanning] = useState(false)
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })

    // Handle mouse down for panning
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) { // Left click
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

    // Calculate grid size dynamically based on zoom
    const baseGridSize = 20
    const gridStep = Math.pow(2, Math.floor(Math.log2(viewState.zoom)))
    const gridSize = baseGridSize / gridStep

    // Adjust opacity based on zoom for smooth transitions
    const minGridOpacity = 0.05
    const maxGridOpacity = 0.15
    const gridOpacity = Math.min(maxGridOpacity, Math.max(minGridOpacity, 0.1 * viewState.zoom))

    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Dynamic grid background like Figma */}
            <svg className={styles.gridSvg} width="100%" height="100%">
                <defs>
                    <pattern
                        id="smallGrid"
                        width={gridSize * viewState.zoom}
                        height={gridSize * viewState.zoom}
                        patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${viewState.x},${viewState.y})`}
                    >
                        <path
                            d={`M ${gridSize * viewState.zoom} 0 L 0 0 0 ${gridSize * viewState.zoom}`}
                            fill="none"
                            stroke={`rgba(0, 0, 0, ${gridOpacity})`}
                            strokeWidth="0.5"
                        />
                    </pattern>
                    <pattern
                        id="largeGrid"
                        width={gridSize * viewState.zoom * 5}
                        height={gridSize * viewState.zoom * 5}
                        patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${viewState.x},${viewState.y})`}
                    >
                        <path
                            d={`M ${gridSize * viewState.zoom * 5} 0 L 0 0 0 ${gridSize * viewState.zoom * 5}`}
                            fill="none"
                            stroke={`rgba(0, 0, 0, ${gridOpacity * 2})`}
                            strokeWidth="0.5"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="white" />
                <rect width="100%" height="100%" fill="url(#smallGrid)" />
                <rect width="100%" height="100%" fill="url(#largeGrid)" />
            </svg>

            {/* Controls overlay */}
            <div className={styles.controls}>
                <button onClick={() => setViewState({ x: 0, y: 0, zoom: 1 })}>
                    Reset View
                </button>
                <span className={styles.zoomLevel}>Zoom: {Math.round(viewState.zoom * 100)}%</span>
            </div>
        </div>
    )
}
