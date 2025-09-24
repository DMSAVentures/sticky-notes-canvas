// Base note with core properties
export interface BaseNote {
    id: string
    content: string
    color: string
    width: number
    height: number
}

// Note with position for rendering
export interface StickyNoteData extends BaseNote {
    x: number
    y: number
    zIndex: number
}

// Canvas view state
export interface ViewState {
    x: number
    y: number
    zoom: number
}

// Note stored with timestamps
export interface StoredNote extends BaseNote {
    createdAt: number
    updatedAt: number
}

// Note position in a specific canvas
export interface StoredNotePositionCanvas {
    noteId: string
    x: number
    y: number
    zIndex: number
}

// Canvas with its note arrangement
export interface StoredCanvas {
    id: string
    name: string
    notePositions: StoredNotePositionCanvas[]
    viewState: ViewState
    createdAt: number
    updatedAt: number
}

export interface LocalStorageAppData {
    version: string
    canvases: Record<string, StoredCanvas>
    notes: Record<string, StoredNote>
    lastActiveCanvasId?: string
}

// ============= Constants =============

export const NOTE_COLORS = [
    '#ffeb3b', // Yellow
    '#ff9800', // Orange
    '#4caf50', // Green
    '#2196f3', // Blue
    '#e91e63', // Pink
    '#9c27b0', // Purple
    '#00bcd4', // Cyan
    '#ff5722', // Deep Orange
]

export const STORAGE_KEY = 'sticky-notes-app'
export const STORAGE_VERSION = '1.0.0'
