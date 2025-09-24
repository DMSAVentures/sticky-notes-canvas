/**
 * Safely queries the DOM with error handling
 */
export function safeQuerySelector<T extends Element>(
    selector: string,
    parent: Document | Element = document
): T | null {
    try {
        return parent.querySelector<T>(selector)
    } catch (error) {
        console.error(`Failed to query selector: ${selector}`, error)
        return null
    }
}

/**
 * Safely gets element bounding rect with fallback
 */
export function safeGetBoundingRect(element: Element | null): DOMRect | null {
    try {
        return element?.getBoundingClientRect() ?? null
    } catch (error) {
        console.error('Failed to get bounding rect:', error)
        return null
    }
}

/**
 * Safely adds event listener with cleanup function
 */
export function safeAddEventListener<K extends keyof WindowEventMap>(
    target: Window | Document | Element | null,
    type: K,
    listener: (ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): (() => void) | null {
    try {
        if (!target) return null

        target.addEventListener(type as string, listener as EventListener, options)

        return () => {
            try {
                target.removeEventListener(type as string, listener as EventListener, options)
            } catch (error) {
                console.error(`Failed to remove event listener: ${type}`, error)
            }
        }
    } catch (error) {
        console.error(`Failed to add event listener: ${type}`, error)
        return null
    }
}

/**
 * Safely confirms with user (with fallback to true in testing)
 */
export function safeConfirm(message: string): boolean {
    try {
        // In testing environments, window.confirm might not be available
        if (typeof window !== 'undefined' && window.confirm) {
            return window.confirm(message)
        }
        return true
    } catch (error) {
        console.error('Failed to show confirm dialog:', error)
        return false
    }
}

/**
 * Safely focuses an element
 */
export function safeFocus(element: HTMLElement | null): void {
    try {
        element?.focus()
    } catch (error) {
        console.error('Failed to focus element:', error)
    }
}