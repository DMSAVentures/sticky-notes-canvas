import { StickyNoteData } from '../components/StickyNote'
import { StorageData, StoredCanvas, StoredNote, StoredNotePosition } from './storage.types'

const STORAGE_KEY = 'sticky-notes-app'
const STORAGE_VERSION = '1.0.0'

class StorageService {
    // Generate a new UUID using native crypto API
    generateId(): string {
        return crypto.randomUUID()
    }

    // Load all data from localStorage
    load(): StorageData | null {
        try {
            const data = localStorage.getItem(STORAGE_KEY)
            if (!data) return null

            const parsed = JSON.parse(data) as StorageData

            // Check version compatibility
            if (parsed.version !== STORAGE_VERSION) {
                console.warn('Storage version mismatch, might need migration')
            }

            return parsed
        } catch (error) {
            console.error('Failed to load storage:', error)
            return null
        }
    }

    // Save all data to localStorage
    save(data: StorageData): boolean {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            return true
        } catch (error) {
            console.error('Failed to save storage:', error)
            return false
        }
    }

    // Initialize empty storage
    initializeStorage(): StorageData {
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
        viewState: { x: number; y: number; zoom: number },
        name?: string
    ): boolean {
        const storage = this.load() || this.initializeStorage()

        // Update or create canvas
        const existingCanvas = storage.canvases[canvasId]
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
        storage.canvases[canvasId] = canvas

        // Save/update notes
        notes.forEach(note => {
            storage.notes[note.id] = {
                id: note.id,
                content: note.content,
                color: note.color,
                width: note.width,
                height: note.height,
                createdAt: storage.notes[note.id]?.createdAt || Date.now(),
                updatedAt: Date.now()
            }
        })

        storage.lastActiveCanvasId = canvasId

        return this.save(storage)
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

    // Clear all storage
    clearAll(): boolean {
        try {
            localStorage.removeItem(STORAGE_KEY)
            return true
        } catch (error) {
            console.error('Failed to clear storage:', error)
            return false
        }
    }
}

export const storageService = new StorageService()