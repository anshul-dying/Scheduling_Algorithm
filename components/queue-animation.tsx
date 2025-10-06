"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import type { QueueAnimation, Process } from "@/lib/types"

interface QueueAnimationProps {
  animation: QueueAnimation
  isPlaying: boolean
  onPlayPause: () => void
  onReset: () => void
  onTimeChange: (time: number) => void
}

export function QueueAnimationComponent({
  animation,
  isPlaying,
  onPlayPause,
  onReset,
  onTimeChange,
}: QueueAnimationProps) {
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(0)
  const [speed, setSpeed] = useState(1)

  const currentSnapshot = animation.snapshots[currentSnapshotIndex] || animation.snapshots[0]

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentSnapshotIndex((prev) => {
        if (prev >= animation.snapshots.length - 1) {
          return prev
        }
        const newIndex = prev + 1
        // Defer notifying parent until after render to avoid setState in render of parent warning
        const nextTime = animation.snapshots[newIndex]?.time || 0
        queueMicrotask(() => onTimeChange(nextTime))
        return newIndex
      })
    }, 1000 / speed)

    return () => clearInterval(interval)
  }, [isPlaying, speed, animation.snapshots, onTimeChange])

  const handleReset = () => {
    setCurrentSnapshotIndex(0)
    onReset()
  }

  const handleSliderChange = (value: number[]) => {
    const newIndex = Math.floor((value[0] / 100) * (animation.snapshots.length - 1))
    setCurrentSnapshotIndex(newIndex)
    const nextTime = animation.snapshots[newIndex]?.time || 0
    // Defer to avoid updating parent during render
    queueMicrotask(() => onTimeChange(nextTime))
  }

  const ProcessCard = ({
    process,
    status,
  }: { process: Process; status: "waiting" | "ready" | "running" | "completed" }) => {
    const statusColors = {
      waiting: "bg-gray-100 border-gray-300 text-gray-600",
      ready: "bg-blue-100 border-blue-300 text-blue-700",
      running: "bg-green-100 border-green-300 text-green-700",
      completed: "bg-purple-100 border-purple-300 text-purple-700",
    }

    return (
      <div className={`p-2 rounded-lg border-2 transition-all duration-300 ${statusColors[status]}`}>
        <div className="font-semibold text-sm">{process.id}</div>
        <div className="text-xs">
          AT: {process.arrivalTime} | BT: {process.burstTime}
          {process.priority !== undefined && ` | P: ${process.priority}`}
        </div>
        {process.remainingTime !== undefined && process.remainingTime !== process.burstTime && (
          <div className="text-xs">Remaining: {process.remainingTime}</div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Queue Animation - {animation.algorithm}</span>
          <div className="text-sm font-normal">
            Time: {currentSnapshot?.time || 0} / {animation.totalTime}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation Controls */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSnapshotIndex(Math.max(0, currentSnapshotIndex - 1))}
            disabled={currentSnapshotIndex === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button onClick={onPlayPause} size="sm">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSnapshotIndex(Math.min(animation.snapshots.length - 1, currentSnapshotIndex + 1))}
            disabled={currentSnapshotIndex >= animation.snapshots.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm">Speed:</span>
            <Slider
              value={[speed]}
              onValueChange={(value: number[]) => setSpeed(value[0])}
              min={0.5}
              max={3}
              step={0.5}
              className="w-20"
            />
            <span className="text-sm">{speed}x</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentSnapshotIndex === 0 ? 0 : (currentSnapshotIndex / (animation.snapshots.length - 1)) * 100]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{animation.totalTime}</span>
          </div>
        </div>

        {/* Queue Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Waiting Processes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-600">Waiting</h4>
            <div className="min-h-[100px] p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="space-y-2">
                {currentSnapshot?.waitingProcesses.map((process) => (
                  <ProcessCard key={process.id} process={process} status="waiting" />
                ))}
                {currentSnapshot?.waitingProcesses.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">No waiting processes</div>
                )}
              </div>
            </div>
          </div>

          {/* Ready Queue */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-blue-600">Ready Queue</h4>
            <div className="min-h-[100px] p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
              <div className="space-y-2">
                {currentSnapshot?.readyQueue.map((process) => (
                  <ProcessCard key={process.id} process={process} status="ready" />
                ))}
                {currentSnapshot?.readyQueue.length === 0 && (
                  <div className="text-xs text-blue-400 text-center py-4">No ready processes</div>
                )}
              </div>
            </div>
          </div>

          {/* Running Process */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-green-600">Running</h4>
            <div className="min-h-[100px] p-3 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
              {currentSnapshot?.runningProcess ? (
                <ProcessCard process={currentSnapshot.runningProcess} status="running" />
              ) : (
                <div className="text-xs text-green-400 text-center py-4">CPU Idle</div>
              )}
            </div>
          </div>

          {/* Completed Processes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-purple-600">Completed</h4>
            <div className="min-h-[100px] p-3 bg-purple-50 rounded-lg border-2 border-dashed border-purple-200">
              <div className="space-y-2">
                {currentSnapshot?.completedProcesses.map((process) => (
                  <ProcessCard key={process.id} process={process} status="completed" />
                ))}
                {currentSnapshot?.completedProcesses.length === 0 && (
                  <div className="text-xs text-purple-400 text-center py-4">No completed processes</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-level Queues for Feedback Algorithms */}
        {currentSnapshot?.multilevelQueues && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Multi-level Feedback Queues</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentSnapshot.multilevelQueues.map((queue, index) => (
                <div key={index} className="space-y-2">
                  <h5 className="font-medium text-sm">
                    Queue {index} (Priority {index})
                  </h5>
                  <div className="min-h-[80px] p-3 bg-orange-50 rounded-lg border-2 border-dashed border-orange-200">
                    <div className="space-y-2">
                      {queue.map((process) => (
                        <ProcessCard key={process.id} process={process} status="ready" />
                      ))}
                      {queue.length === 0 && <div className="text-xs text-orange-400 text-center py-2">Empty</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Action Description */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm">
            <strong>Current State:</strong> Time {currentSnapshot?.time || 0} -
            {currentSnapshot?.runningProcess
              ? ` Process ${currentSnapshot.runningProcess.id} is running`
              : " CPU is idle"}
            {currentSnapshot?.readyQueue.length > 0 &&
              ` | ${currentSnapshot.readyQueue.length} process(es) in ready queue`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
