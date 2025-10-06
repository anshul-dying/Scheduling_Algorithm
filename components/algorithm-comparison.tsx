"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Trophy, Medal, Award, Zap, Timer, ContrastIcon as Compare } from "lucide-react"
import type { Process, SchedulingAlgorithm, SchedulingResult, AlgorithmConfig } from "@/lib/types"
import { runSchedulingAlgorithm, algorithmNames, algorithmDescriptions } from "@/lib/scheduler"

interface AlgorithmComparisonProps {
  processes: Process[]
  config: AlgorithmConfig
}

interface ComparisonResult {
  algorithm: SchedulingAlgorithm
  name: string
  result: SchedulingResult
  cpuUtilization: number
  throughput: number
}

export function AlgorithmComparison({ processes, config }: AlgorithmComparisonProps) {
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<SchedulingAlgorithm[]>(["FCFS", "RR", "SJF"])
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([])
  const [isComparing, setIsComparing] = useState(false)

  const allAlgorithms: SchedulingAlgorithm[] = ["FCFS", "RR", "SJF", "PRIORITY"]

  const handleAlgorithmToggle = (algorithm: SchedulingAlgorithm, checked: boolean) => {
    if (checked) {
      setSelectedAlgorithms([...selectedAlgorithms, algorithm])
    } else {
      setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== algorithm))
    }
  }

  const runComparison = () => {
    if (processes.length === 0 || selectedAlgorithms.length === 0) return

    setIsComparing(true)
    const results: ComparisonResult[] = []

    selectedAlgorithms.forEach((algorithm) => {
      let algorithmConfig = {}
      if (algorithm === "RR") {
        algorithmConfig = { timeQuantum: config.timeQuantum }
      } else if (algorithm === "PRIORITY") {
        algorithmConfig = { isPreemptive: config.isPreemptive, priorityHighIsMin: config.priorityHighIsMin }
      }

      const result = runSchedulingAlgorithm(algorithm, processes, algorithmConfig)
      const totalIdleTime = result.ganttChart
        .filter((item) => item.isIdle)
        .reduce((sum, item) => sum + (item.endTime - item.startTime), 0)
      const cpuUtilization = ((result.totalTime - totalIdleTime) / result.totalTime) * 100
      const throughput = result.processes.length / result.totalTime

      results.push({
        algorithm,
        name: algorithmNames[algorithm],
        result,
        cpuUtilization,
        throughput,
      })
    })

    setComparisonResults(results)
    setIsComparing(false)
  }

  const getBestAlgorithm = (
    metric: keyof Pick<SchedulingResult, "averageWaitingTime" | "averageTurnaroundTime" | "averageResponseTime">,
  ) => {
    if (comparisonResults.length === 0) return null
    return comparisonResults.reduce((best, current) => (current.result[metric] < best.result[metric] ? current : best))
  }

  const getBestUtilization = () => {
    if (comparisonResults.length === 0) return null
    return comparisonResults.reduce((best, current) => (current.cpuUtilization > best.cpuUtilization ? current : best))
  }

  const getBestThroughput = () => {
    if (comparisonResults.length === 0) return null
    return comparisonResults.reduce((best, current) => (current.throughput > best.throughput ? current : best))
  }

  const bestWaiting = getBestAlgorithm("averageWaitingTime")
  const bestTurnaround = getBestAlgorithm("averageTurnaroundTime")
  const bestResponse = getBestAlgorithm("averageResponseTime")
  const bestUtilization = getBestUtilization()
  const bestThroughputAlg = getBestThroughput()

  // Prepare chart data
  const chartData = comparisonResults.map((result) => ({
    name: result.algorithm,
    fullName: result.name,
    waiting: result.result.averageWaitingTime,
    turnaround: result.result.averageTurnaroundTime,
    response: result.result.averageResponseTime,
    utilization: result.cpuUtilization,
    throughput: result.throughput,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compare className="w-5 h-5" />
          Algorithm Comparison
        </CardTitle>
        <CardDescription>Compare multiple scheduling algorithms side-by-side</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Algorithm Selection */}
        <div>
          <h4 className="font-medium mb-3">Select Algorithms to Compare</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allAlgorithms.map((algorithm) => (
              <div key={algorithm} className="flex items-start space-x-2 w-full">
                <Checkbox
                  id={algorithm}
                  checked={selectedAlgorithms.includes(algorithm)}
                  onCheckedChange={(checked: boolean | "indeterminate") => handleAlgorithmToggle(algorithm, Boolean(checked))}
                />
                <div className="grid gap-1.5 leading-none min-w-0 w-full">
                  <label
                    htmlFor={algorithm}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words whitespace-normal"
                  >
                    {algorithmNames[algorithm]}
                  </label>
                  <p className="text-xs text-muted-foreground break-words whitespace-normal">{algorithmDescriptions[algorithm]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Run Comparison Button */}
        <Button
          onClick={runComparison}
          disabled={selectedAlgorithms.length === 0 || processes.length === 0 || isComparing}
          className="w-full"
          size="lg"
        >
          {isComparing
            ? "Running Comparison..."
            : `Compare ${selectedAlgorithms.length} Algorithm${selectedAlgorithms.length !== 1 ? "s" : ""}`}
        </Button>

        {/* Comparison Results */}
        {comparisonResults.length > 0 && (
          <>
            {/* Performance Winners */}
            <div>
              <h4 className="font-medium mb-3">Performance Leaders</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium">Best Waiting Time</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{bestWaiting?.algorithm}</div>
                  <div className="text-xs text-muted-foreground">
                    {bestWaiting?.result.averageWaitingTime.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Medal className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium">Best Response</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{bestResponse?.algorithm}</div>
                  <div className="text-xs text-muted-foreground">
                    {bestResponse?.result.averageResponseTime.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium">Best Turnaround</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{bestTurnaround?.algorithm}</div>
                  <div className="text-xs text-muted-foreground">
                    {bestTurnaround?.result.averageTurnaroundTime.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium">Best Utilization</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{bestUtilization?.algorithm}</div>
                  <div className="text-xs text-muted-foreground">{bestUtilization?.cpuUtilization.toFixed(1)}%</div>
                </div>

                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium">Best Throughput</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{bestThroughputAlg?.algorithm}</div>
                  <div className="text-xs text-muted-foreground">{bestThroughputAlg?.throughput.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div>
              <h4 className="font-medium mb-3">Detailed Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium w-40">Algorithm</th>
                      <th className="text-left p-3 font-medium">Avg Waiting</th>
                      <th className="text-left p-3 font-medium">Avg Turnaround</th>
                      <th className="text-left p-3 font-medium">Avg Response</th>
                      <th className="text-left p-3 font-medium">CPU Utilization</th>
                      <th className="text-left p-3 font-medium">Throughput</th>
                      <th className="text-left p-3 font-medium">Total Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map((result) => (
                      <tr key={result.algorithm} className="border-b border-border/50">
                        <td className="p-3">
                          <div className="min-w-0">
                            <div className="font-mono font-medium">{result.algorithm}</div>
                            <div className="text-xs text-muted-foreground break-words whitespace-normal">{result.name}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{result.result.averageWaitingTime.toFixed(2)}</span>
                            {bestWaiting?.algorithm === result.algorithm && (
                              <Trophy className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{result.result.averageTurnaroundTime.toFixed(2)}</span>
                            {bestTurnaround?.algorithm === result.algorithm && (
                              <Trophy className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{result.result.averageResponseTime.toFixed(2)}</span>
                            {bestResponse?.algorithm === result.algorithm && (
                              <Trophy className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{result.cpuUtilization.toFixed(1)}%</span>
                            {bestUtilization?.algorithm === result.algorithm && (
                              <Trophy className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span>{result.throughput.toFixed(2)}</span>
                            {bestThroughputAlg?.algorithm === result.algorithm && (
                              <Trophy className="w-3 h-3 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">{result.result.totalTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Metrics Comparison */}
              <div>
                <h4 className="font-medium mb-3">Time Metrics Comparison</h4>
                <div className="h-64 border border-border rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="waiting" fill="#ef4444" name="Waiting Time" />
                      <Bar dataKey="turnaround" fill="#f59e0b" name="Turnaround Time" />
                      <Bar dataKey="response" fill="#10b981" name="Response Time" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="h-64 border border-border rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="utilization" stroke="#8b5cf6" name="CPU Utilization %" />
                      <Line type="monotone" dataKey="throughput" stroke="#06b6d4" name="Throughput" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium mb-3">Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium mb-2 text-blue-800 dark:text-blue-200">For Interactive Systems</h5>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Choose <strong>{bestResponse?.algorithm}</strong> for best response time, ideal for user-facing
                    applications where quick feedback is crucial.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h5 className="font-medium mb-2 text-green-800 dark:text-green-200">For Batch Processing</h5>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Choose <strong>{bestTurnaround?.algorithm}</strong> for best turnaround time, optimal for batch jobs
                    where total completion time matters most.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h5 className="font-medium mb-2 text-purple-800 dark:text-purple-200">For Resource Efficiency</h5>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Choose <strong>{bestUtilization?.algorithm}</strong> for maximum CPU utilization, best when hardware
                    resources are expensive or limited.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h5 className="font-medium mb-2 text-orange-800 dark:text-orange-200">For High Throughput</h5>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Choose <strong>{bestThroughputAlg?.algorithm}</strong> for maximum throughput, ideal for systems
                    that need to process many jobs quickly.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
