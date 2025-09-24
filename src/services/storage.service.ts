import {
    StickyNoteData,
    LocalStorageAppData,
    StoredCanvas,
    ViewState,
    STORAGE_KEY,
    STORAGE_VERSION
} from '../types'

class StorageService {
    // Generate a new UUID using native crypto API
    generateId(): string {
        return crypto.randomUUID()
    }

    // Load all data from localStorage
    load(): LocalStorageAppData | null {
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            if (!data) return null

            const parsed = JSON.parse(data) as LocalStorageAppData

            // Check version compatibility
            if (parsed.version !== STORAGE_VERSION) {
                console.warn('Storage version mismatch')
            }

            return parsed
        } catch (error) {
            console.error('Failed to load storage:', error)
            return null
        }
    }

    // Save all data to localStorage
    save(data: LocalStorageAppData): boolean {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            return true
        } catch (error) {
            console.error('Failed to save storage:', error)
            return false
        }
    }

    // Initialize empty storage
    initializeStorage(): LocalStorageAppData {
        return {
            version: STORAGE_VERSION,
            canvases: {},
            notes: {},
            lastActiveCanvasId: undefined
        }
    }

    // Create a new canvas
    createCanvas(name: string = 'Untitled Canvas'): StoredCanvas {
        return {
            id: this.generateId(),
            name,
            notePositions: [],
            viewState: { x: 0, y: 0, zoom: 1 },
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    }

    // Save canvas state
    saveCanvas(
        canvasId: string,
        notes: StickyNoteData[],
        viewState: ViewState,
        name?: string
    ): boolean {
        const appData = this.load() || this.initializeStorage()

        // Update or create canvas
        const existingCanvas = appData.canvases[canvasId]
        const canvas: StoredCanvas = {
            id: canvasId,
            name: name || existingCanvas?.name || 'Untitled Canvas',
            notePositions: notes.map(note => ({
                noteId: note.id,
                x: note.x,
                y: note.y,
                zIndex: note.zIndex
            })),
            viewState,
            createdAt: existingCanvas?.createdAt || Date.now(),
            updatedAt: Date.now()
        }

        // Save canvas
        appData.canvases[canvasId] = canvas

        // Save/update notes
        notes.forEach(note => {
            appData.notes[note.id] = {
                id: note.id,
                content: note.content,
                color: note.color,
                width: note.width,
                height: note.height,
                createdAt: appData.notes[note.id]?.createdAt || Date.now(),
                updatedAt: Date.now()
            }
        })

        appData.lastActiveCanvasId = canvasId

        return this.save(appData)
    }

    // Load canvas state
    loadCanvas(canvasId: string): {
        canvas: StoredCanvas
        notes: StickyNoteData[]
    } | null {
        const storage = this.load()
        if (!storage) return null

        const canvas = storage.canvases[canvasId]
        if (!canvas) return null

        // Reconstruct notes with positions
        const notes: StickyNoteData[] = canvas.notePositions
            .map(pos => {
                const note = storage.notes[pos.noteId]
                if (!note) return null

                return {
                    id: note.id,
                    x: pos.x,
                    y: pos.y,
                    zIndex: pos.zIndex,
                    content: note.content,
                    color: note.color,
                    width: note.width,
                    height: note.height
                }
            })
            .filter(Boolean) as StickyNoteData[]

        return { canvas, notes }
    }

    // Get all canvases
    getAllCanvases(): StoredCanvas[] {
        const storage = this.load()
        if (!storage) return []

        return Object.values(storage.canvases).sort((a, b) => b.updatedAt - a.updatedAt)
    }

    // Rename canvas
    renameCanvas(canvasId: string, newName: string): boolean {
        const storage = this.load()
        if (!storage || !storage.canvases[canvasId]) return false

        storage.canvases[canvasId].name = newName
        storage.canvases[canvasId].updatedAt = Date.now()

        return this.save(storage)
    }

    // Delete canvas
    deleteCanvas(canvasId: string): boolean {
        const storage = this.load()
        if (!storage) return false

        // Get note IDs from canvas
        const canvas = storage.canvases[canvasId]
        if (!canvas) return false

        const noteIds = new Set(canvas.notePositions.map(p => p.noteId))

        // Check if notes are used in other canvases
        const notesInUse = new Set<string>()
        Object.entries(storage.canvases).forEach(([id, c]) => {
            if (id !== canvasId) {
                c.notePositions.forEach(p => notesInUse.add(p.noteId))
            }
        })

        // Delete notes not used elsewhere
        noteIds.forEach(noteId => {
            if (!notesInUse.has(noteId)) {
                delete storage.notes[noteId]
            }
        })

        // Delete canvas
        delete storage.canvases[canvasId]

        // Update last active canvas if needed
        if (storage.lastActiveCanvasId === canvasId) {
            const remainingCanvases = Object.keys(storage.canvases)
            storage.lastActiveCanvasId = remainingCanvases[0] || undefined
        }

        return this.save(storage)
    }

    // Get note count for a canvas
    getNoteCount(canvasId: string): number {
        const storage = this.load()
        if (!storage || !storage.canvases[canvasId]) return 0
        return storage.canvases[canvasId].notePositions.length
    }
}

export const storageService = new StorageService()
