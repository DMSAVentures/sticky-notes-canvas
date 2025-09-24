import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { storageService } from '../services/storage.service'
import { StickyNoteData, StoredCanvas, ViewState } from '../types'

interface CanvasContextValue {
    canvases: StoredCanvas[]
    currentCanvasId: string | null
    selectCanvas: (canvasId: string) => void
    createCanvas: () => void
    renameCanvas: (canvasId: string, newName: string) => void
    deleteCanvas: (canvasId: string) => void
    getNoteCount: (canvasId: string) => number

    notes: StickyNoteData[]
    setNotes: (notes: StickyNoteData[] | ((prev: StickyNoteData[]) => StickyNoteData[])) => void
    viewState: ViewState
    setViewState: (viewState: ViewState | ((prev: ViewState) => ViewState)) => void
    nextZIndex: number
    setNextZIndex: (zIndex: number | ((prev: number) => number)) => void

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

    // Initialize canvas state from localStorage on mount
    useEffect(() => {
        try {
            const storage = storageService.load()
            const allCanvases = storageService.getAllCanvases()
            setCanvases(allCanvases)

            if (storage && storage.lastActiveCanvasId) {
                const canvasData = storageService.loadCanvas(storage.lastActiveCanvasId)
                if (canvasData) {
                    setCurrentCanvasId(storage.lastActiveCanvasId)
                    setNotes(canvasData.notes)
                    setViewState(canvasData.canvas.viewState)
                    const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
                    setNextZIndex(maxZ + 1)
                }
            } else {
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
        } catch (error) {
            console.error('Failed to initialize canvas:', error)
            // Initialize with default canvas on error
            const newCanvas = storageService.createCanvas('Canvas 1')
            setCurrentCanvasId(newCanvas.id)
            setCanvases([newCanvas])
            setNotes([])
            setViewState({ x: 0, y: 0, zoom: 1 })
            setNextZIndex(1)
        }
    }, [])

    // Debounced auto-save to localStorage (500ms delay)
    useEffect(() => {
        if (!currentCanvasId) return

        setIsSaving(true)
        const timeoutId = setTimeout(() => {
            try {
                const success = storageService.saveCanvas(currentCanvasId, notes, viewState)
                if (!success) {
                    console.warn('Failed to save canvas state')
                }
            } catch (error) {
                console.error('Error saving canvas:', error)
            } finally {
                setIsSaving(false)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [notes, viewState, currentCanvasId])

    const selectCanvas = (canvasId: string) => {
        if (canvasId === currentCanvasId) return

        try {
            // Persist current state before switching
            if (currentCanvasId) {
                storageService.saveCanvas(currentCanvasId, notes, viewState)
            }

            const canvasData = storageService.loadCanvas(canvasId)
            if (canvasData) {
                setCurrentCanvasId(canvasId)
                setNotes(canvasData.notes)
                setViewState(canvasData.canvas.viewState)
                const maxZ = Math.max(0, ...canvasData.notes.map(n => n.zIndex))
                setNextZIndex(maxZ + 1)
            }
        } catch (error) {
            console.error('Failed to switch canvas:', error)
        }
    }

    const createCanvas = () => {
        // Persist current canvas before creating new one
        if (currentCanvasId) {
            storageService.saveCanvas(currentCanvasId, notes, viewState)
        }

        const newCanvas = storageService.createCanvas(`Canvas ${canvases.length + 1}`)
        storageService.saveCanvas(newCanvas.id, [], { x: 0, y: 0, zoom: 1 })

        setCurrentCanvasId(newCanvas.id)
        setNotes([])
        setViewState({ x: 0, y: 0, zoom: 1 })
        setNextZIndex(1)

        setCanvases(storageService.getAllCanvases())
    }

    const renameCanvas = (canvasId: string, newName: string) => {
        storageService.renameCanvas(canvasId, newName)
        setCanvases(storageService.getAllCanvases())
    }

    const deleteCanvas = (canvasId: string) => {
        storageService.deleteCanvas(canvasId)

        // Auto-switch to first remaining canvas if current was deleted
        if (canvasId === currentCanvasId) {
            const remainingCanvases = storageService.getAllCanvases()
            if (remainingCanvases.length > 0) {
                selectCanvas(remainingCanvases[0].id)
            }
        }

        setCanvases(storageService.getAllCanvases())
    }

    const getNoteCount = (canvasId: string) => {
        return storageService.getNoteCount(canvasId)
    }

    // Keyboard shortcuts: Cmd/Ctrl + 1-9 switches canvases
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