import { useRef, useState, useEffect, MouseEvent, WheelEvent } from 'react'
import styles from './App.module.css'
import { StickyNote } from './components/StickyNote'
import { TrashCan } from './components/TrashCan'
import { CanvasSwitcher } from './components/CanvasSwitcher'
import { storageService } from './services/storage.service'
import { StickyNoteData, ViewState, StoredCanvas } from './types'

export function App() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })
    const [isPanning, setIsPanning] = useState(false)
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })
    const [notes, setNotes] = useState<StickyNoteData[]>([])
    const [nextZIndex, setNextZIndex] = useState(1)
    const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
    const [canvasId, setCanvasId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [allCanvases, setAllCanvases] = useState<StoredCanvas[]>([])

    // Handle mouse down for panning
    const handleMouseDown = (e: MouseEvent) => {
        // Only pan if clicking on canvas, not on notes
        if (e.target === e.currentTarget && e.button === 0) { // Left click
            setIsPanning(true)
            setStartPan({ x: e.clientX - viewState.x, y: e.clientY - viewState.y })
            e.preventDefault()
        }
    }

    // Handle double click to create new note
    const handleDoubleClick = (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect) {
                const x = (e.clientX - rect.left - viewState.x) / viewState.zoom
                const y = (e.clientY - rect.top - viewState.y) / viewState.zoom

                const newNote: StickyNoteData = {
                    id: storageService.generateId(),
                    x,
                    y,
                    width: 200,
                    height: 150,
                    content: '',
                    color: '#ffeb3b',
                    zIndex: nextZIndex
                }

                setNotes([...notes, newNote])
                setNextZIndex(nextZIndex + 1)
            }
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

    // Handle note updates
    const handleNoteUpdate = (id: string, updates: Partial<StickyNoteData>) => {
        setNotes(notes.map(note =>
            note.id === id ? { ...note, ...updates } : note
        ))
    }

    // Handle note deletion
    const handleNoteDelete = (id: string) => {
        setNotes(notes.filter(note => note.id !== id))
    }

    // Handle note selection (bring to front)
    const handleNoteSelect = (id: string) => {
        // Only update if the note is not already on top
        const selectedNote = notes.find(note => note.id === id)
        const maxZIndex = Math.max(...notes.map(n => n.zIndex))

        if (selectedNote && selectedNote.zIndex < maxZIndex) {
            setNotes(notes.map(note =>
                note.id === id ? { ...note, zIndex: nextZIndex } : note
            ))
            setNextZIndex(nextZIndex + 1)
        }
    }

    // Handle canvas selection
    const handleSelectCanvas = (selectedCanvasId: string) => {
        if (selectedCanvasId === canvasId) return

        // Save current canvas state before switching
        if (canvasId) {
            storageService.saveCanvas(canvasId, notes, viewState)
        }

        // Load selected canvas
        const canvasData = storageService.loadCanvas(selectedCanvasId)
        if (canvasData) {
            setCanvasId(selectedCanvasId)
            setNotes(canvasData.notes)
            setViewState(canvasData.canvas.viewState)
            const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
            setNextZIndex(maxZ + 1)
        }
    }

    // Handle creating new canvas
    const handleCreateCanvas = () => {
        // Save current canvas first
        if (canvasId) {
            storageService.saveCanvas(canvasId, notes, viewState)
        }

        // Create new canvas
        const newCanvas = storageService.createCanvas(`Canvas ${allCanvases.length + 1}`)
        storageService.saveCanvas(newCanvas.id, [], { x: 0, y: 0, zoom: 1 })

        // Switch to new canvas
        setCanvasId(newCanvas.id)
        setNotes([])
        setViewState({ x: 0, y: 0, zoom: 1 })
        setNextZIndex(1)

        // Refresh canvas list
        setAllCanvases(storageService.getAllCanvases())
    }

    // Handle renaming canvas
    const handleRenameCanvas = (renameCanvasId: string, newName: string) => {
        storageService.renameCanvas(renameCanvasId, newName)
        setAllCanvases(storageService.getAllCanvases())
    }

    // Handle deleting canvas
    const handleDeleteCanvas = (deleteCanvasId: string) => {
        storageService.deleteCanvas(deleteCanvasId)

        // If deleting current canvas, switch to another
        if (deleteCanvasId === canvasId) {
            const remainingCanvases = storageService.getAllCanvases()
            if (remainingCanvases.length > 0) {
                handleSelectCanvas(remainingCanvases[0].id)
            }
        }

        setAllCanvases(storageService.getAllCanvases())
    }

    // Initialize or load canvas on mount
    useEffect(() => {
        const storage = storageService.load()
        const canvases = storageService.getAllCanvases()
        setAllCanvases(canvases)

        if (storage && storage.lastActiveCanvasId) {
            // Load last active canvas
            const canvasData = storageService.loadCanvas(storage.lastActiveCanvasId)
            if (canvasData) {
                setCanvasId(storage.lastActiveCanvasId)
                setNotes(canvasData.notes)
                setViewState(canvasData.canvas.viewState)
                const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
                setNextZIndex(maxZ + 1)
            }
        } else {
            // Create new canvas if none exist
            if (canvases.length === 0) {
                const newCanvas = storageService.createCanvas('Canvas 1')
                setCanvasId(newCanvas.id)
                storageService.saveCanvas(newCanvas.id, [], { x: 0, y: 0, zoom: 1 })
                setAllCanvases([newCanvas])
            } else {
                // Load first canvas
                const firstCanvas = canvases[0]
                const canvasData = storageService.loadCanvas(firstCanvas.id)
                if (canvasData) {
                    setCanvasId(firstCanvas.id)
                    setNotes(canvasData.notes)
                    setViewState(canvasData.canvas.viewState)
                    const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
                    setNextZIndex(maxZ + 1)
                }
            }
        }
    }, [])

    // Auto-save on changes
    useEffect(() => {
        if (!canvasId) return

        setIsSaving(true)
        const timeoutId = setTimeout(() => {
            storageService.saveCanvas(canvasId, notes, viewState)
            setIsSaving(false)
        }, 500) // Debounce saves by 500ms

        return () => clearTimeout(timeoutId)
    }, [notes, viewState, canvasId])

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
            onDoubleClick={handleDoubleClick}
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

            {/* Viewport for notes */}
            <div
                className={styles.viewport}
                style={{
                    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
                }}
            >
                {notes.map(note => (
                    <StickyNote
                        key={note.id}
                        {...note}
                        zoom={viewState.zoom}
                        onUpdate={handleNoteUpdate}
                        onDelete={handleNoteDelete}
                        onSelect={handleNoteSelect}
                        onDragStart={(id) => setDraggingNoteId(id)}
                        onDragEnd={() => setDraggingNoteId(null)}
                    />
                ))}
            </div>

            {/* Canvas Switcher */}
            <CanvasSwitcher
                canvases={allCanvases}
                currentCanvasId={canvasId}
                onSelectCanvas={handleSelectCanvas}
                onCreateCanvas={handleCreateCanvas}
                onRenameCanvas={handleRenameCanvas}
                onDeleteCanvas={handleDeleteCanvas}
                getNoteCount={(id) => storageService.getNoteCount(id)}
            />

            {/* Controls overlay */}
            <div className={styles.controls}>
                <button onClick={() => setViewState({ x: 0, y: 0, zoom: 1 })}>
                    Reset View
                </button>
                <span className={styles.zoomLevel}>Zoom: {Math.round(viewState.zoom * 100)}%</span>
                {isSaving && <span className={styles.saveIndicator}>Saving...</span>}
                {!isSaving && canvasId && <span className={styles.saveIndicator}>✓ Saved</span>}
            </div>

            {/* Help text */}
            {notes.length === 0 && (
                <div className={styles.helpText}>
                    Double-click anywhere to create a sticky note
                </div>
            )}

            {/* Trash can for deleting notes */}
            <TrashCan
                isActive={draggingNoteId !== null}
                onDrop={() => {
                    if (draggingNoteId) {
                        handleNoteDelete(draggingNoteId)
                        setDraggingNoteId(null)
                    }
                }}
            />
        </div>
    )
}
