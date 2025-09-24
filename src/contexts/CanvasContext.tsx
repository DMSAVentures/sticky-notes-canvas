import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storageService } from '../services/storage.service'
import { StickyNoteData, StoredCanvas, ViewState } from '../types'

interface CanvasContextValue {
    // Canvas management
    canvases: StoredCanvas[]
    currentCanvasId: string | null
    selectCanvas: (canvasId: string) => void
    createCanvas: () => void
    renameCanvas: (canvasId: string, newName: string) => void
    deleteCanvas: (canvasId: string) => void
    getNoteCount: (canvasId: string) => number

    // Current canvas state
    notes: StickyNoteData[]
    setNotes: (notes: StickyNoteData[] | ((prev: StickyNoteData[]) => StickyNoteData[])) => void
    viewState: ViewState
    setViewState: (viewState: ViewState | ((prev: ViewState) => ViewState)) => void
    nextZIndex: number
    setNextZIndex: (zIndex: number | ((prev: number) => number)) => void

    // Save state
    isSaving: boolean
}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined)

export function useCanvas() {
    const context = useContext(CanvasContext)
    if (!context) {
        throw new Error('useCanvas must be used within CanvasProvider')
    }
    return context
}

interface CanvasProviderProps {
    children: ReactNode
}

export function CanvasProvider({ children }: CanvasProviderProps) {
    const [canvases, setCanvases] = useState<StoredCanvas[]>([])
    const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null)
    const [notes, setNotes] = useState<StickyNoteData[]>([])
    const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 1 })
    const [nextZIndex, setNextZIndex] = useState(1)
    const [isSaving, setIsSaving] = useState(false)

    // Load canvases on mount
    useEffect(() => {
        const storage = storageService.load()
        const allCanvases = storageService.getAllCanvases()
        setCanvases(allCanvases)

        if (storage && storage.lastActiveCanvasId) {
            // Load last active canvas
            const canvasData = storageService.loadCanvas(storage.lastActiveCanvasId)
            if (canvasData) {
                setCurrentCanvasId(storage.lastActiveCanvasId)
                setNotes(canvasData.notes)
                setViewState(canvasData.canvas.viewState)
                const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
                setNextZIndex(maxZ + 1)
            }
        } else {
            // Create or load first canvas
            if (allCanvases.length === 0) {
                const newCanvas = storageService.createCanvas('Canvas 1')
                setCurrentCanvasId(newCanvas.id)
                storageService.saveCanvas(newCanvas.id, [], { x: 0, y: 0, zoom: 1 })
                setCanvases([newCanvas])
            } else {
                const firstCanvas = allCanvases[0]
                const canvasData = storageService.loadCanvas(firstCanvas.id)
                if (canvasData) {
                    setCurrentCanvasId(firstCanvas.id)
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
        if (!currentCanvasId) return

        setIsSaving(true)
        const timeoutId = setTimeout(() => {
            storageService.saveCanvas(currentCanvasId, notes, viewState)
            setIsSaving(false)
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [notes, viewState, currentCanvasId])

    // Canvas selection
    const selectCanvas = (canvasId: string) => {
        if (canvasId === currentCanvasId) return

        // Save current canvas before switching
        if (currentCanvasId) {
            storageService.saveCanvas(currentCanvasId, notes, viewState)
        }

        // Load selected canvas
        const canvasData = storageService.loadCanvas(canvasId)
        if (canvasData) {
            setCurrentCanvasId(canvasId)
            setNotes(canvasData.notes)
            setViewState(canvasData.canvas.viewState)
            const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
            setNextZIndex(maxZ + 1)
        }
    }

    // Create new canvas
    const createCanvas = () => {
        // Save current canvas first
        if (currentCanvasId) {
            storageService.saveCanvas(currentCanvasId, notes, viewState)
        }

        // Create new canvas
        const newCanvas = storageService.createCanvas(`Canvas ${canvases.length + 1}`)
        storageService.saveCanvas(newCanvas.id, [], { x: 0, y: 0, zoom: 1 })

        // Switch to new canvas
        setCurrentCanvasId(newCanvas.id)
        setNotes([])
        setViewState({ x: 0, y: 0, zoom: 1 })
        setNextZIndex(1)

        // Refresh canvas list
        setCanvases(storageService.getAllCanvases())
    }

    // Rename canvas
    const renameCanvas = (canvasId: string, newName: string) => {
        storageService.renameCanvas(canvasId, newName)
        setCanvases(storageService.getAllCanvases())
    }

    // Delete canvas
    const deleteCanvas = (canvasId: string) => {
        storageService.deleteCanvas(canvasId)

        // If deleting current canvas, switch to another
        if (canvasId === currentCanvasId) {
            const remainingCanvases = storageService.getAllCanvases()
            if (remainingCanvases.length > 0) {
                selectCanvas(remainingCanvases[0].id)
            }
        }

        setCanvases(storageService.getAllCanvases())
    }

    // Get note count for a canvas
    const getNoteCount = (canvasId: string) => {
        return storageService.getNoteCount(canvasId)
    }

    // Add keyboard shortcuts for canvas switching
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                const index = parseInt(e.key) - 1
                if (index >= 0 && index < canvases.length && index < 9) {
                    selectCanvas(canvases[index].id)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [canvases])

    const value: CanvasContextValue = {
        canvases,
        currentCanvasId,
        selectCanvas,
        createCanvas,
        renameCanvas,
        deleteCanvas,
        getNoteCount,
        notes,
        setNotes,
        viewState,
        setViewState,
        nextZIndex,
        setNextZIndex,
        isSaving
    }

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    )
}