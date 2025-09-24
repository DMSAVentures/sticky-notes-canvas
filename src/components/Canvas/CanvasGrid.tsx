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
    return (
        <svg className={styles.gridSvg} width="100%" height="100%">
            <defs>
                <pattern
                    id="smallGrid"
                    width={gridSize * viewState.zoom}
                    height={gridSize * viewState.zoom}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${viewState.x},${viewState.y})`}
                >
                    <path
                        d={`M ${gridSize * viewState.zoom} 0 L 0 0 0 ${gridSize * viewState.zoom}`}
                        fill="none"
                        stroke={`rgba(0, 0, 0, ${gridOpacity})`}
                        strokeWidth="0.5"
                    />
                </pattern>
                <pattern
                    id="largeGrid"
                    width={gridSize * viewState.zoom * 5}
                    height={gridSize * viewState.zoom * 5}
                    patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${viewState.x},${viewState.y})`}
                >
                    <path
                        d={`M ${gridSize * viewState.zoom * 5} 0 L 0 0 0 ${gridSize * viewState.zoom * 5}`}
                        fill="none"
                        stroke={`rgba(0, 0, 0, ${gridOpacity * 2})`}
                        strokeWidth="0.5"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
            <rect width="100%" height="100%" fill="url(#largeGrid)" />
        </svg>
    )
}