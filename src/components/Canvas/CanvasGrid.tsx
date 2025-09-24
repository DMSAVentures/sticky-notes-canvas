import styles from './Canvas.module.css'

interface CanvasGridProps {
    gridSize: number
    gridOpacity: number
    viewState: {
        x: number
        y: number
        zoom: number
    }
}

export function CanvasGrid({ gridSize, gridOpacity, viewState }: CanvasGridProps) {
    // Keep dots at constant pixel size regardless of zoom for visual clarity
    const smallDotRadius = 1
    const largeDotRadius = 1.5

    return (
        <svg className={styles.gridSvg} width="100%" height="100%">
            <defs>
                <pattern
                    id="smallDots"
                    width={gridSize * viewState.zoom}
                    height={gridSize * viewState.zoom}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${viewState.x},${viewState.y})`}
                >
                    <circle
                        cx={(gridSize * viewState.zoom) / 2}
                        cy={(gridSize * viewState.zoom) / 2}
                        r={smallDotRadius}
                        fill={`rgba(0, 0, 0, ${gridOpacity})`}
                    />
                </pattern>
                <pattern
                    id="largeDots"
                    width={gridSize * viewState.zoom * 5}
                    height={gridSize * viewState.zoom * 5}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${viewState.x},${viewState.y})`}
                >
                    <circle
                        cx={(gridSize * viewState.zoom * 5) / 2}
                        cy={(gridSize * viewState.zoom * 5) / 2}
                        r={largeDotRadius}
                        fill={`rgba(0, 0, 0, ${gridOpacity * 2})`}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" fill="url(#smallDots)" />
            <rect width="100%" height="100%" fill="url(#largeDots)" />
        </svg>
    )
}