'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react'
import { EnrichedTermData, getRelatedTerms, getScoreLabel, getScoreColor } from '@/lib/radar-data'

interface Node {
  id: string
  term: string
  score: number
  clicks: number
  impressions: number
  ctr: number
  position: number
  x: number
  y: number
  radius: number
  isCenter: boolean
  color: string
}

interface Link {
  source: string
  target: string
  strength: number
}

interface DragState {
  nodeId: string
}

interface TermClusterProps {
  selectedTerm: EnrichedTermData | null
  allTerms: EnrichedTermData[]
  onTermSelect: (term: EnrichedTermData) => void
}

function createClusterLayout(
  selectedTerm: EnrichedTermData,
  allTerms: EnrichedTermData[],
  width: number,
  height: number
) {
  const centerX = width / 2
  const centerY = height / 2
  const relatedTerms = getRelatedTerms(selectedTerm, allTerms)
  const clusterTerms = [selectedTerm, ...relatedTerms]
  const minLogImpressions = Math.min(...clusterTerms.map((term) => Math.log10(term.impressions + 1)))
  const maxLogImpressions = Math.max(...clusterTerms.map((term) => Math.log10(term.impressions + 1)))

  const getRadiusFromImpressions = (impressions: number, { isCenter = false } = {}) => {
    if (maxLogImpressions === minLogImpressions) {
      return isCenter ? 50 : 28
    }

    const normalized =
      (Math.log10(impressions + 1) - minLogImpressions) / (maxLogImpressions - minLogImpressions)

    const baseRadius = 18 + normalized * 18
    return isCenter ? Math.max(46, baseRadius + 8) : baseRadius
  }

  const centerNode: Node = {
    id: selectedTerm.term,
    term: selectedTerm.term,
    score: selectedTerm.score,
    clicks: selectedTerm.clicks,
    impressions: selectedTerm.impressions,
    ctr: selectedTerm.ctr,
    position: selectedTerm.position,
    x: centerX,
    y: centerY,
    radius: getRadiusFromImpressions(selectedTerm.impressions, { isCenter: true }),
    isCenter: true,
    color: getScoreColor(selectedTerm.score),
  }

  const nodes: Node[] = [centerNode]
  const links: Link[] = []
  const ringCount = relatedTerms.length > 8 ? 2 : 1

  relatedTerms.forEach((term, index) => {
    const ringIndex = ringCount === 1 ? 0 : index % ringCount
    const itemsInRing = relatedTerms.filter((_, itemIndex) => (ringCount === 1 ? 0 : itemIndex % ringCount) === ringIndex).length
    const indexInRing = ringCount === 1 ? index : Math.floor(index / ringCount)
    const angleOffset = ringIndex * 0.45
    const angle = (2 * Math.PI * indexInRing) / Math.max(itemsInRing, 1) + angleOffset
    const orbitRadius = 165 + ringIndex * 85
    const nodeRadius = getRadiusFromImpressions(term.impressions)

    const node: Node = {
      id: term.term,
      term: term.term,
      score: term.score,
      clicks: term.clicks,
      impressions: term.impressions,
      ctr: term.ctr,
      position: term.position,
      x: centerX + Math.cos(angle) * orbitRadius,
      y: centerY + Math.sin(angle) * orbitRadius,
      radius: nodeRadius,
      isCenter: false,
      color: getScoreColor(term.score),
    }

    nodes.push(node)
    links.push({
      source: selectedTerm.term,
      target: term.term,
      strength: 1 - Math.abs(term.score - selectedTerm.score) / 100,
    })

    if (indexInRing > 0) {
      const previousIndex = ringCount === 1 ? index - 1 : index - ringCount
      const previousNode = relatedTerms[previousIndex]
      if (previousNode) {
        links.push({
          source: previousNode.term,
          target: term.term,
          strength: 0.3,
        })
      }
    }
  })

  return { nodes, links }
}

export function TermCluster({ selectedTerm, allTerms, onTermSelect }: TermClusterProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragMovedRef = useRef(false)
  
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    syncMotionPreference()
    mediaQuery.addEventListener('change', syncMotionPreference)

    return () => mediaQuery.removeEventListener('change', syncMotionPreference)
  }, [])

  // Initialize nodes and links when selected term changes
  useEffect(() => {
    if (!selectedTerm || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width || 800
    const height = rect.height || 500

    setDimensions({ width, height })

    const { nodes: nextNodes, links: nextLinks } = createClusterLayout(
      selectedTerm,
      allTerms,
      width,
      height
    )

    setNodes(nextNodes)
    setLinks(nextLinks)
  }, [selectedTerm, allTerms])

  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2

  const projectX = (x: number) => centerX + (x - centerX) * zoom
  const projectY = (y: number) => centerY + (y - centerY) * zoom

  const getPointerPosition = (clientX: number, clientY: number) => {
    if (!svgRef.current) return null

    const rect = svgRef.current.getBoundingClientRect()

    return {
      x: ((clientX - rect.left) / rect.width) * dimensions.width,
      y: ((clientY - rect.top) / rect.height) * dimensions.height,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState) return

    const pointer = getPointerPosition(event.clientX, event.clientY)
    if (!pointer) return

    dragMovedRef.current = true

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id !== dragState.nodeId) return node

        const baseX = centerX + (pointer.x - centerX) / zoom
        const baseY = centerY + (pointer.y - centerY) / zoom
        const padding = node.radius + 12

        return {
          ...node,
          x: Math.max(padding, Math.min(dimensions.width - padding, baseX)),
          y: Math.max(padding, Math.min(dimensions.height - padding, baseY)),
        }
      })
    )
  }

  const endDrag = () => {
    setDragState(null)
  }

  const handleNodeClick = (node: Node) => {
    if (dragMovedRef.current) {
      dragMovedRef.current = false
      return
    }

    const termData = allTerms.find(t => t.term === node.term)
    if (termData) {
      onTermSelect(termData)
    }
  }

  if (!selectedTerm) {
    return (
      <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Maximize2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-foreground/70">
              Selecione um termo para visualizar o cluster
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              O cluster mostra termos relacionados e suas conexoes semanticas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-4">
        <div>
          <CardTitle className="text-lg font-medium tracking-tight">
            Cluster de Termos
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Visualizacao interativa de termos semanticamente relacionados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.1))}
            aria-label="Reduzir zoom do cluster"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            aria-label="Aumentar zoom do cluster"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          className="relative h-[500px] overflow-hidden"
          style={{ cursor: dragState ? 'grabbing' : 'default' }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {/* Gradient definitions */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background grid */}
            <g opacity="0.05">
              {Array.from({ length: 20 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={i * (dimensions.height / 20)}
                  x2={dimensions.width}
                  y2={i * (dimensions.height / 20)}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 30 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={i * (dimensions.width / 30)}
                  y1="0"
                  x2={i * (dimensions.width / 30)}
                  y2={dimensions.height}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* Orbital rings */}
            <circle
              cx={centerX}
              cy={centerY}
              r={150 * zoom}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.1"
              className={!prefersReducedMotion ? 'animate-[spin_60s_linear_infinite]' : undefined}
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={220 * zoom}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="8 8"
              opacity="0.05"
              className={!prefersReducedMotion ? 'animate-[spin_90s_linear_infinite_reverse]' : undefined}
            />

            {/* Connection lines */}
            <g>
              {links.map((link, i) => {
                const sourceNode = nodes.find(n => n.id === link.source)
                const targetNode = nodes.find(n => n.id === link.target)
                if (!sourceNode || !targetNode) return null

                const isHighlighted = 
                  hoveredNode === link.source || 
                  hoveredNode === link.target

                return (
                  <g key={`link-${i}`}>
                    <line
                      x1={projectX(sourceNode.x)}
                      y1={projectY(sourceNode.y)}
                      x2={projectX(targetNode.x)}
                      y2={projectY(targetNode.y)}
                      stroke={isHighlighted ? sourceNode.color : 'currentColor'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 0.6 : link.strength * 0.15}
                      className="transition-[stroke,stroke-width,stroke-opacity] duration-300"
                    />
                    {/* Animated pulse along the line */}
                    {isHighlighted && !prefersReducedMotion && (
                      <circle r="3" fill={sourceNode.color}>
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M${projectX(sourceNode.x)},${projectY(sourceNode.y)} L${projectX(targetNode.x)},${projectY(targetNode.y)}`}
                        />
                      </circle>
                    )}
                  </g>
                )
              })}
            </g>

            {/* Nodes */}
            <g>
              {nodes.map((node) => {
                const isHovered = hoveredNode === node.id
                const scale = isHovered ? 1.15 : 1

                return (
                  <g
                    key={node.id}
                    transform={`translate(${projectX(node.x)}, ${projectY(node.y)})`}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onPointerDown={() => {
                      if (node.isCenter) return
                      dragMovedRef.current = false
                      setDragState({ nodeId: node.id })
                    }}
                    style={{ cursor: node.isCenter ? 'pointer' : 'grab' }}
                    className="transition-transform duration-200"
                  >
                    {/* Glow effect */}
                    {(node.isCenter || isHovered) && (
                      <circle
                        r={node.radius * 2}
                        fill={node.color}
                        opacity={0.15}
                        className={node.isCenter ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      r={node.radius * scale}
                      fill={node.color}
                      fillOpacity={node.isCenter ? 0.9 : 0.7}
                      stroke={node.color}
                      strokeWidth={isHovered ? 3 : 2}
                      strokeOpacity={isHovered ? 1 : 0.5}
                      filter={isHovered ? 'url(#glow)' : undefined}
                      className="transition-[fill-opacity,stroke-opacity,stroke-width,transform] duration-200"
                    />

                    {/* Inner circle for depth */}
                    <circle
                      r={node.radius * scale * 0.7}
                      fill={node.color}
                      fillOpacity={0.3}
                    />

                    {/* Score indicator ring */}
                    <circle
                      r={node.radius * scale + 5}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      strokeDasharray={`${node.score * Math.PI * 2 * (node.radius + 5)} 1000`}
                      strokeLinecap="round"
                      opacity={0.6}
                      transform="rotate(-90)"
                    />

                    {/* Label */}
                    {(node.isCenter || isHovered || node.radius > 25) && (
                      <text
                        y={node.isCenter ? -node.radius - 15 : node.radius + 18}
                        textAnchor="middle"
                        className="fill-foreground text-xs font-medium"
                        style={{
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          fontSize: node.isCenter ? '14px' : '11px'
                        }}
                      >
                        {node.term.length > 20 
                          ? node.term.slice(0, 18) + '…' 
                          : node.term
                        }
                      </text>
                    )}

                    {/* Score badge for center */}
                    {node.isCenter && (
                      <text
                        y={6}
                        textAnchor="middle"
                        className="fill-white text-sm font-semibold"
                      >
                        {node.score.toFixed(2)}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* Hover tooltip */}
          {hoveredNode && !nodes.find(n => n.id === hoveredNode)?.isCenter && (
            <div 
              className="pointer-events-none absolute rounded-lg border border-border/50 bg-card/95 p-3 shadow-xl backdrop-blur-sm"
              style={{
                left: projectX(nodes.find(n => n.id === hoveredNode)?.x || 0) + 20,
                top: projectY(nodes.find(n => n.id === hoveredNode)?.y || 0) - 20,
                transform: 'translateY(-50%)'
              }}
            >
              {(() => {
                const node = nodes.find(n => n.id === hoveredNode)
                if (!node) return null
                return (
                  <>
                    <p className="mb-2 font-medium text-foreground">{node.term}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Score</span>
                        <Badge 
                          variant="outline" 
                          className="h-5 text-[10px]"
                          style={{ borderColor: node.color, color: node.color }}
                        >
                          {node.score.toFixed(1)} - {getScoreLabel(node.score)}
                        </Badge>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">CTR</span>
                        <span className="font-mono">{node.ctr.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Posicao</span>
                        <span className="font-mono">{node.position.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Cliques</span>
                        <span className="font-mono">{node.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Impressoes</span>
                        <span className="font-mono">{node.impressions.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg border border-border/30 bg-card/80 p-3 backdrop-blur-sm">
            {[
              { label: 'Evitar', color: '#10B981' },
              { label: 'Avaliar', color: '#6366F1' },
              { label: 'Testar', color: '#F59E0B' },
              { label: 'Investir', color: '#EF4444' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stats overlay */}
          <div className="absolute right-4 top-4 rounded-lg border border-border/30 bg-card/80 p-3 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">
              {nodes.length} termos no cluster
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              Arraste os nos para reorganizar
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
