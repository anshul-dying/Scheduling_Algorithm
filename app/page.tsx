"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcessInput } from "@/components/process-input"
import { AlgorithmSelector } from "@/components/algorithm-selector"
import { GanttChart } from "@/components/gantt-chart"
import { ResultsDashboard } from "@/components/results-dashboard"
import { AlgorithmComparison } from "@/components/algorithm-comparison"
import { QueueAnimationComponent } from "@/components/queue-animation"
import type { Process, SchedulingAlgorithm, SchedulingResult, AlgorithmConfig, QueueAnimation } from "@/lib/types"
import { runSchedulingAlgorithm, algorithmNames, generateQueueAnimation } from "@/lib/scheduler"

export default function OSSchedulerPage() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SchedulingAlgorithm>("FCFS")
  const [processes, setProcesses] = useState<Process[]>([
    { id: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
    { id: "P2", arrivalTime: 1, burstTime: 3, priority: 1 },
    { id: "P3", arrivalTime: 2, burstTime: 8, priority: 3 },
    { id: "P4", arrivalTime: 3, burstTime: 6, priority: 1 },
  ])
  const [result, setResult] = useState<SchedulingResult | null>(null)
  const [queueAnimation, setQueueAnimation] = useState<QueueAnimation | null>(null)
  const [config, setConfig] = useState<AlgorithmConfig>({
    timeQuantum: 2,
    numberOfQueues: 3,
    quantumMultiplier: 2,
  })
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [currentAnimationTime, setCurrentAnimationTime] = useState(0)

  const handleRunSimulation = () => {
    if (processes.length === 0) return

    let algorithmConfig = {}
    if (selectedAlgorithm === "RR") {
      algorithmConfig = { timeQuantum: config.timeQuantum }
    } else if (selectedAlgorithm === "FB") {
      algorithmConfig = { numberOfQueues: config.numberOfQueues }
    } else if (selectedAlgorithm === "FBV") {
      algorithmConfig = { numberOfQueues: config.numberOfQueues, quantumMultiplier: config.quantumMultiplier }
    } else if (selectedAlgorithm === "PRIORITY") {
      algorithmConfig = { isPreemptive: config.isPreemptive }
    }

    const schedulingResult = runSchedulingAlgorithm(selectedAlgorithm, processes, algorithmConfig)
    setResult(schedulingResult)

    const animation = generateQueueAnimation(selectedAlgorithm, processes, algorithmConfig)
    setQueueAnimation(animation)
    setCurrentAnimationTime(0)
    setIsAnimationPlaying(false)
  }

  const handleAnimationPlayPause = () => {
    setIsAnimationPlaying(!isAnimationPlaying)
  }

  const handleAnimationReset = () => {
    setCurrentAnimationTime(0)
    setIsAnimationPlaying(false)
  }

  const handleAnimationTimeChange = (time: number) => {
    setCurrentAnimationTime(time)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">OS Scheduling Simulator</h1>
              <p className="text-muted-foreground mt-2">
                Interactive visualization of operating system scheduling algorithms
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              Educational Tool
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="simulation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulation">Single Algorithm Simulation</TabsTrigger>
            <TabsTrigger value="comparison">Algorithm Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Algorithm Selection */}
              <div className="xl:col-span-1">
                <AlgorithmSelector
                  selectedAlgorithm={selectedAlgorithm}
                  onAlgorithmChange={setSelectedAlgorithm}
                  config={config}
                  onConfigChange={setConfig}
                  onRunSimulation={handleRunSimulation}
                  canRunSimulation={processes.length > 0}
                />
              </div>

              {/* Process Input and Results */}
              <div className="xl:col-span-3 space-y-6">
                {/* Process Input Component */}
                <ProcessInput processes={processes} onProcessesChange={setProcesses} />

                {/* Results */}
                {result && (
                  <>
                    <ResultsDashboard
                      result={result}
                      algorithmName={algorithmNames[selectedAlgorithm]}
                      selectedAlgorithm={selectedAlgorithm}
                    />

                    <Tabs defaultValue="gantt" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                        <TabsTrigger value="queue">Queue Animation</TabsTrigger>
                      </TabsList>

                      <TabsContent value="gantt">
                        <GanttChart
                          ganttChart={result.ganttChart}
                          processes={result.processes}
                          totalTime={result.totalTime}
                          algorithmName={algorithmNames[selectedAlgorithm]}
                        />
                      </TabsContent>

                      <TabsContent value="queue">
                        {queueAnimation && (
                          <QueueAnimationComponent
                            animation={queueAnimation}
                            isPlaying={isAnimationPlaying}
                            onPlayPause={handleAnimationPlayPause}
                            onReset={handleAnimationReset}
                            onTimeChange={handleAnimationTimeChange}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Process Input */}
              <div className="xl:col-span-1">
                <ProcessInput processes={processes} onProcessesChange={setProcesses} />
              </div>

              {/* Algorithm Comparison */}
              <div className="xl:col-span-3">
                <AlgorithmComparison processes={processes} config={config} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
