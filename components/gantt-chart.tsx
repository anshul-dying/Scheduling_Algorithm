"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import type { GanttItem, Process } from "@/lib/types"

interface GanttChartProps {
  ganttChart: GanttItem[]
  processes: Process[]
  totalTime: number
  algorithmName: string
}

const processColors = [
  "bg-chart-1 border-chart-1/20",
  "bg-chart-2 border-chart-2/20",
  "bg-chart-3 border-chart-3/20",
  "bg-chart-4 border-chart-4/20",
  "bg-chart-5 border-chart-5/20",
  "bg-blue-500 border-blue-500/20",
  "bg-green-500 border-green-500/20",
  "bg-purple-500 border-purple-500/20",
  "bg-orange-500 border-orange-500/20",
  "bg-pink-500 border-pink-500/20",
]

export function GanttChart({ ganttChart, processes, totalTime, algorithmName }: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  // Create process color mapping
  const processColorMap = new Map<string, string>()
  const uniqueProcessIds = Array.from(new Set(processes.map((p) => p.id)))
  uniqueProcessIds.forEach((processId, index) => {
    processColorMap.set(processId, processColors[index % processColors.length])
  })

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev * 1.5, 4))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev / 1.5, 0.5))
  const handleResetZoom = () => setZoomLevel(1)

  const getItemWidth = (item: GanttItem) => {
    const baseWidth = ((item.endTime - item.startTime) / totalTime) * 100
    return Math.max(baseWidth * zoomLevel, 2) // Minimum 2% width
  }

  const getItemColor = (item: GanttItem) => {
    if (item.isIdle) {
      return "bg-muted text-muted-foreground border-muted"
    }
    return `${processColorMap.get(item.processId) || processColors[0]} text-white`
  }

  const formatTime = (time: number) => {
    return time.toString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gantt Chart Visualization</CardTitle>
            <CardDescription>{algorithmName} execution timeline</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 4}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {Math.round(zoomLevel * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Process Legend */}
        <div>
          <h4 className="font-medium mb-3">Process Legend</h4>
          <div className="flex flex-wrap gap-2">
            {uniqueProcessIds.map((processId) => {
              const process = processes.find((p) => p.id === processId)
              return (
                <div key={processId} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 ${processColorMap.get(processId)}`} />
                  <span className="text-sm font-mono font-medium">{processId}</span>
                  <span className="text-xs text-muted-foreground">
                    (Burst: {process?.burstTime}, Arrival: {process?.arrivalTime})
                  </span>
                </div>
              )
            })}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-muted border-muted" />
              <span className="text-sm font-medium">IDLE</span>
              <span className="text-xs text-muted-foreground">(CPU not in use)</span>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        <div>
          <h4 className="font-medium mb-3">Timeline Visualization</h4>
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            {/* Time Scale Header */}
            <div className="bg-muted/50 p-2 border-b border-border">
              <div className="flex items-center text-xs text-muted-foreground font-mono">
                <div className="w-16 flex-shrink-0">Process</div>
                <div className="flex-1 relative" style={{ minWidth: `${300 * zoomLevel}px` }}>
                  <div className="flex">
                    {Array.from({ length: totalTime + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 text-center border-l border-border/50 px-1"
                        style={{ width: `${(100 / totalTime) * zoomLevel}%`, minWidth: "20px" }}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gantt Bars */}
            <div className="p-2">
              <div className="flex items-center">
                <div className="w-16 flex-shrink-0 text-sm font-medium">CPU</div>
                <div
                  className="flex-1 relative h-12 border border-border rounded"
                  style={{ minWidth: `${300 * zoomLevel}px` }}
                >
                  <div className="flex h-full">
                    {ganttChart.map((item, index) => (
                      <div
                        key={index}
                        className={`
                          relative border-r border-border/30 cursor-pointer transition-all duration-200
                          ${getItemColor(item)}
                          ${hoveredItem === index ? "ring-2 ring-ring ring-offset-1" : ""}
                        `}
                        style={{ width: `${getItemWidth(item)}%` }}
                        onMouseEnter={() => setHoveredItem(index)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="flex items-center justify-center h-full px-1">
                          <span className="text-xs font-mono font-medium truncate">
                            {item.isIdle ? "IDLE" : item.processId}
                          </span>
                        </div>

                        {/* Tooltip */}
                        {hoveredItem === index && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                            <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 text-xs whitespace-nowrap">
                              <div className="font-medium mb-1">
                                {item.isIdle ? "CPU Idle Time" : `Process ${item.processId}`}
                              </div>
                              <div className="space-y-1 text-muted-foreground">
                                <div>Start: {item.startTime}</div>
                                <div>End: {item.endTime}</div>
                                <div>Duration: {item.endTime - item.startTime}</div>
                                {!item.isIdle && (
                                  <>
                                    <div className="border-t border-border pt-1 mt-1">
                                      {(() => {
                                        const process = processes.find((p) => p.id === item.processId)
                                        return process ? (
                                          <>
                                            <div>Burst Time: {process.burstTime}</div>
                                            <div>Arrival: {process.arrivalTime}</div>
                                          </>
                                        ) : null
                                      })()}
                                    </div>
                                  </>
                                )}
                              </div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                <div className="border-4 border-transparent border-t-popover"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Labels */}
            <div className="bg-muted/25 p-2 border-t border-border">
              <div className="flex items-center text-xs text-muted-foreground">
                <div className="w-16 flex-shrink-0"></div>
                <div className="flex-1" style={{ minWidth: `${300 * zoomLevel}px` }}>
                  <div className="flex">
                    {ganttChart.map((item, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 text-center font-mono"
                        style={{ width: `${getItemWidth(item)}%` }}
                      >
                        <div className="flex justify-between px-1">
                          <span>{formatTime(item.startTime)}</span>
                          {index === ganttChart.length - 1 && <span>{formatTime(item.endTime)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-foreground">{totalTime}</div>
            <div className="text-muted-foreground">Total Time</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-foreground">{ganttChart.length}</div>
            <div className="text-muted-foreground">Time Slices</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-foreground">
              {ganttChart.filter((item) => item.isIdle).reduce((sum, item) => sum + (item.endTime - item.startTime), 0)}
            </div>
            <div className="text-muted-foreground">Idle Time</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-foreground">
              {Math.round(
                (1 -
                  ganttChart
                    .filter((item) => item.isIdle)
                    .reduce((sum, item) => sum + (item.endTime - item.startTime), 0) /
                    totalTime) *
                  100,
              )}
              %
            </div>
            <div className="text-muted-foreground">CPU Utilization</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
