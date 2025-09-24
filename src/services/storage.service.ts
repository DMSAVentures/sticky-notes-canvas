import {
    StickyNoteData,
    LocalStorageAppData,
    StoredCanvas,
    ViewState,
    STORAGE_KEY
} from '../types'

class StorageService {
    generateId(): string {
        return crypto.randomUUID()
    }

    load(): LocalStorageAppData | null {
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            if (!data) return null

            const parsed = JSON.parse(data) as LocalStorageAppData

            // Validate data structure
            if (!parsed.canvases || !parsed.notes) {
                console.error('Invalid storage structure, reinitializing')
                return this.initializeStorage()
            }

            return parsed
        } catch (error) {
            console.error('Failed to load storage:', error)

            // Attempt to recover by backing up corrupted data
            try {
                const corruptedData = localStorage.getItem(STORAGE_KEY)
                if (corruptedData) {
                    localStorage.setItem(`${STORAGE_KEY}_backup_${Date.now()}`, corruptedData)
                    console.info('Backed up corrupted data')
                }
            } catch (backupError) {
                console.error('Failed to backup corrupted data:', backupError)
            }

            return null
        }
    }

    save(data: LocalStorageAppData): boolean {
        try {
            const serialized = JSON.stringify(data)

            // Check for quota exceeded
            try {
                localStorage.setItem(STORAGE_KEY, serialized)
            } catch (quotaError: any) {
                if (quotaError?.name === 'QuotaExceededError' ||
                    quotaError?.code === 22 ||
                    quotaError?.code === 1014) {
                    console.error('Storage quota exceeded, attempting cleanup')

                    // Try to clean up old backups
                    const keys = Object.keys(localStorage)
                    const backupKeys = keys.filter(k => k.startsWith(`${STORAGE_KEY}_backup_`))

                    if (backupKeys.length > 0) {
                        backupKeys.sort().slice(0, -1).forEach(key => {
                            localStorage.removeItem(key)
                        })

                        // Retry save
                        localStorage.setItem(STORAGE_KEY, serialized)
                        console.info('Storage saved after cleanup')
                    } else {
                        throw quotaError
                    }
                } else {
                    throw quotaError
                }
            }

            return true
        } catch (error) {
            console.error('Failed to save storage:', error)

            // Notify user about storage failure
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('storage-error', {
                    detail: { error, operation: 'save' }
                }))
            }

            return false
        }
    }

    initializeStorage(): LocalStorageAppData {
        return {
            canvases: {},
            notes: {},
            lastActiveCanvasId: undefined
        }
    }

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

    saveCanvas(
        canvasId: string,
        notes: StickyNoteData[],
        viewState: ViewState,
        name?: string
    ): boolean {
        const appData = this.load() || this.initializeStorage()

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

        appData.canvases[canvasId] = canvas

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

    loadCanvas(canvasId: string): {
        canvas: StoredCanvas
        notes: StickyNoteData[]
    } | null {
        const storage = this.load()
        if (!storage) return null

        const canvas = storage.canvases[canvasId]
        if (!canvas) return null

        // Merge note content with canvas-specific positions
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

    getAllCanvases(): StoredCanvas[] {
        const storage = this.load()
        if (!storage) return []

        return Object.values(storage.canvases).sort((a, b) => b.updatedAt - a.updatedAt)
    }

    renameCanvas(canvasId: string, newName: string): boolean {
        const storage = this.load()
        if (!storage || !storage.canvases[canvasId]) return false

        storage.canvases[canvasId].name = newName
        storage.canvases[canvasId].updatedAt = Date.now()

        return this.save(storage)
    }

    deleteCanvas(canvasId: string): boolean {
        const storage = this.load()
        if (!storage) return false

        // Get note IDs from canvas
        const canvas = storage.canvases[canvasId]
        if (!canvas) return false

        const noteIds = new Set(canvas.notePositions.map(p => p.noteId))

        // Find notes that are shared across canvases
        const notesInUse = new Set<string>()
        Object.entries(storage.canvases).forEach(([id, c]) => {
            if (id !== canvasId) {
                c.notePositions.forEach(p => notesInUse.add(p.noteId))
            }
        })

        // Clean up orphaned notes (not referenced by any canvas)
        noteIds.forEach(noteId => {
            if (!notesInUse.has(noteId)) {
                delete storage.notes[noteId]
            }
        })

        delete storage.canvases[canvasId]

        if (storage.lastActiveCanvasId === canvasId) {
            const remainingCanvases = Object.keys(storage.canvases)
            storage.lastActiveCanvasId = remainingCanvases[0] || undefined
        }

        return this.save(storage)
    }

    getNoteCount(canvasId: string): number {
        const storage = this.load()
        if (!storage || !storage.canvases[canvasId]) return 0
        return storage.canvases[canvasId].notePositions.length
    }
}

export const storageService = new StorageService()
