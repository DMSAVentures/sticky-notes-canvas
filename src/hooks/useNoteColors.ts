import { useState, useRef, MouseEvent, RefObject } from 'react'

interface UseNoteColorsProps {
    id: string
    onUpdate: (id: string, updates: { color: string }) => void
    noteRef?: RefObject<HTMLDivElement>
}

export function useNoteColors({ id, onUpdate, noteRef }: UseNoteColorsProps) {
    const [showColorPicker, setShowColorPicker] = useState(false)
    const localNoteRef = useRef<HTMLDivElement>(null)
    const activeRef = noteRef || localNoteRef

    const handleColorButtonClick = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        setShowColorPicker(!showColorPicker)
    }

    const handleColorSelect = (newColor: string) => (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        onUpdate(id, { color: newColor })
        setShowColorPicker(false)
        activeRef.current?.focus()
    }

    return {
        showColorPicker,
        noteRef: activeRef,
        handleColorButtonClick,
        handleColorSelect
    }
}