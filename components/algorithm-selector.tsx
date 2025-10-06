"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Clock, Layers, Zap, Timer, BarChart3, TrendingUp, Crown } from "lucide-react"
import type { SchedulingAlgorithm, AlgorithmConfig } from "@/lib/types"
import { algorithmNames, algorithmDescriptions } from "@/lib/scheduler"

interface AlgorithmSelectorProps {
  selectedAlgorithm: SchedulingAlgorithm
  onAlgorithmChange: (algorithm: SchedulingAlgorithm) => void
  config: AlgorithmConfig
  onConfigChange: (config: AlgorithmConfig) => void
  onRunSimulation: () => void
  canRunSimulation: boolean
}

const algorithmIcons: Record<SchedulingAlgorithm, React.ReactNode> = {
  FCFS: <Clock className="w-4 h-4" />,
  RR: <Timer className="w-4 h-4" />,
  SPN: <Zap className="w-4 h-4" />,
  SRT: <TrendingUp className="w-4 h-4" />,
  FB: <Layers className="w-4 h-4" />,
  FBV: <BarChart3 className="w-4 h-4" />,
  PRIORITY: <Crown className="w-4 h-4" />,
}

const algorithmTypes: Record<SchedulingAlgorithm, string> = {
  FCFS: "Non-preemptive",
  RR: "Preemptive",
  SPN: "Non-preemptive",
  SRT: "Preemptive",
  FB: "Multi-level",
  FBV: "Multi-level",
  PRIORITY: "Configurable",
}

const algorithmComplexity: Record<SchedulingAlgorithm, "Simple" | "Medium" | "Complex"> = {
  FCFS: "Simple",
  RR: "Medium",
  SPN: "Medium",
  SRT: "Complex",
  FB: "Complex",
  FBV: "Complex",
  PRIORITY: "Medium",
}

export function AlgorithmSelector({
  selectedAlgorithm,
  onAlgorithmChange,
  config,
  onConfigChange,
  onRunSimulation,
  canRunSimulation,
}: AlgorithmSelectorProps) {
  const algorithms: SchedulingAlgorithm[] = ["FCFS", "RR", "SPN", "SRT", "PRIORITY", "FB", "FBV"]

  const handleTimeQuantumChange = (value: number[]) => {
    onConfigChange({ ...config, timeQuantum: value[0] })
  }

  const handleNumberOfQueuesChange = (value: number[]) => {
    onConfigChange({ ...config, numberOfQueues: value[0] })
  }

  const handleQuantumMultiplierChange = (value: number[]) => {
    onConfigChange({ ...config, quantumMultiplier: value[0] })
  }

  const handlePreemptiveChange = (checked: boolean) => {
    onConfigChange({ ...config, isPreemptive: checked })
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Simple":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Complex":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {algorithmIcons[selectedAlgorithm]}
          Algorithm Selection
        </CardTitle>
        <CardDescription>Choose and configure a scheduling algorithm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Algorithm Grid */}
        <div className="grid grid-cols-1 gap-3">
          {algorithms.map((algorithm) => (
            <Button
              key={algorithm}
              variant={selectedAlgorithm === algorithm ? "default" : "outline"}
              className="justify-start text-left h-auto p-4 relative"
              onClick={() => onAlgorithmChange(algorithm)}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">{algorithmIcons[algorithm]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{algorithmNames[algorithm]}</div>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {algorithmTypes[algorithm]}
                      </Badge>
                      <Badge className={`text-xs ${getComplexityColor(algorithmComplexity[algorithm])}`}>
                        {algorithmComplexity[algorithm]}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {algorithmDescriptions[algorithm]}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Algorithm Configuration */}
        {selectedAlgorithm === "RR" && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Time Quantum</Label>
                <span className="text-sm text-muted-foreground">{config.timeQuantum || 2} units</span>
              </div>
              <Slider
                value={[config.timeQuantum || 2]}
                onValueChange={handleTimeQuantumChange}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Time Quantum:</strong> Each process gets this amount of CPU time before being preempted. Smaller
              values provide better responsiveness but higher overhead.
            </div>
          </div>
        )}

        {selectedAlgorithm === "PRIORITY" && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Preemptive Mode</Label>
                <div className="text-xs text-muted-foreground">
                  Allow higher priority processes to interrupt lower priority ones
                </div>
              </div>
              <Switch checked={config.isPreemptive || false} onCheckedChange={handlePreemptiveChange} />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Priority Scheduling:</strong> Processes are scheduled based on their priority values (lower number
              = higher priority).
              {config.isPreemptive
                ? " In preemptive mode, a higher priority process can interrupt a running lower priority process."
                : " In non-preemptive mode, once a process starts executing, it runs to completion."}
            </div>
          </div>
        )}

        {(selectedAlgorithm === "FB" || selectedAlgorithm === "FBV") && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Number of Queues</Label>
                <span className="text-sm text-muted-foreground">{config.numberOfQueues || 3} queues</span>
              </div>
              <Slider
                value={[config.numberOfQueues || 3]}
                onValueChange={handleNumberOfQueuesChange}
                min={2}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>2</span>
                <span>5</span>
              </div>
            </div>

            {selectedAlgorithm === "FBV" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Quantum Multiplier</Label>
                  <span className="text-sm text-muted-foreground">×{config.quantumMultiplier || 2}</span>
                </div>
                <Slider
                  value={[config.quantumMultiplier || 2]}
                  onValueChange={handleQuantumMultiplierChange}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>×1</span>
                  <span>×4</span>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Multi-level Feedback:</strong> Processes start in the highest priority queue and move down when
              they use their time quantum.{" "}
              {selectedAlgorithm === "FBV" && "Each queue level has an increasingly larger time quantum."}
            </div>
          </div>
        )}

        {/* Algorithm Details */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Algorithm Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">
                {selectedAlgorithm === "PRIORITY"
                  ? config.isPreemptive
                    ? "Preemptive"
                    : "Non-preemptive"
                  : algorithmTypes[selectedAlgorithm]}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complexity:</span>
              <Badge className={getComplexityColor(algorithmComplexity[selectedAlgorithm])}>
                {algorithmComplexity[selectedAlgorithm]}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best for:</span>
              <span className="text-right text-xs">
                {selectedAlgorithm === "FCFS" && "Simple batch systems"}
                {selectedAlgorithm === "RR" && "Interactive systems"}
                {selectedAlgorithm === "SPN" && "Batch systems with known job times"}
                {selectedAlgorithm === "SRT" && "Interactive systems with varying job sizes"}
                {selectedAlgorithm === "PRIORITY" && "Systems with process importance hierarchy"}
                {selectedAlgorithm === "FB" && "General-purpose systems"}
                {selectedAlgorithm === "FBV" && "Systems with diverse workloads"}
              </span>
            </div>
          </div>
        </div>

        {/* Run Simulation Button */}
        <Button onClick={onRunSimulation} className="w-full" size="lg" disabled={!canRunSimulation}>
          <Timer className="w-4 h-4 mr-2" />
          Run {algorithmNames[selectedAlgorithm]} Simulation
        </Button>

        {!canRunSimulation && (
          <p className="text-xs text-muted-foreground text-center">Add at least one process to run the simulation</p>
        )}
      </CardContent>
    </Card>
  )
}
