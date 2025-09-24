import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface EditingContextValue {
    editingNoteId: string | null
    autoFocusNoteId: string | null
    startEditing: (noteId: string) => void
    stopEditing: () => void
    stopEditingSpecific: (noteId: string) => void
    setAutoFocus: (noteId: string) => void
    clearAutoFocus: () => void
    isEditing: (noteId: string) => boolean
    shouldAutoFocus: (noteId: string) => boolean
}

const EditingContext = createContext<EditingContextValue | undefined>(undefined)

export function useEditing() {
    const context = useContext(EditingContext)
    if (!context) {
        throw new Error('useEditing must be used within EditingProvider')
    }
    return context
}

interface EditingProviderProps {
    children: ReactNode
}

export function EditingProvider({ children }: EditingProviderProps) {
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
    const [autoFocusNoteId, setAutoFocusNoteId] = useState<string | null>(null)

    const startEditing = useCallback((noteId: string) => {
        setEditingNoteId(noteId)
    }, [])

    const stopEditing = useCallback(() => {
        setEditingNoteId(null)
    }, [])

    const stopEditingSpecific = useCallback((noteId: string) => {
        setEditingNoteId(current => current === noteId ? null : current)
    }, [])

    const setAutoFocus = useCallback((noteId: string) => {
        setAutoFocusNoteId(noteId)
        setEditingNoteId(noteId)
    }, [])

    const clearAutoFocus = useCallback(() => {
        setAutoFocusNoteId(null)
    }, [])

    const isEditing = useCallback((noteId: string) => {
        return editingNoteId === noteId
    }, [editingNoteId])

    const shouldAutoFocus = useCallback((noteId: string) => {
        return autoFocusNoteId === noteId
    }, [autoFocusNoteId])

    const value: EditingContextValue = {
        editingNoteId,
        autoFocusNoteId,
        startEditing,
        stopEditing,
        stopEditingSpecific,
        setAutoFocus,
        clearAutoFocus,
        isEditing,
        shouldAutoFocus
    }

    return (
        <EditingContext.Provider value={value}>
            {children}
        </EditingContext.Provider>
    )
}