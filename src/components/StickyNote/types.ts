export interface StickyNoteData {
    id: string
    x: number
    y: number
    width: number
    height: number
    content: string
    color: string
    zIndex: number
}

export interface StickyNoteProps {
    id: string
    x: number
    y: number
    width: number
    height: number
    content: string
    color: string
    onUpdate: (id: string, updates: Partial<StickyNoteData>) => void
    onDelete: (id: string) => void
    zIndex: number
    onSelect: (id: string) => void
    zoom?: number
    onDragStart?: (id: string) => void
    onDragEnd?: (id: string) => void
}

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