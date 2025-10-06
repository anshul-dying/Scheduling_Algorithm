import type { Process, SchedulingResult, GanttItem } from "../types"

export function fcfsScheduling(processes: Process[]): SchedulingResult {
  const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const ganttChart: GanttItem[] = []
  let currentTime = 0

  const results = sortedProcesses.map((process) => {
    const processResult = { ...process }

    // If current time is less than arrival time, add idle time
    if (currentTime < process.arrivalTime) {
      if (currentTime < process.arrivalTime) {
        ganttChart.push({
          processId: "IDLE",
          startTime: currentTime,
          endTime: process.arrivalTime,
          isIdle: true,
        })
      }
      currentTime = process.arrivalTime
    }

    processResult.startTime = currentTime
    processResult.responseTime = currentTime - process.arrivalTime

    ganttChart.push({
      processId: process.id,
      startTime: currentTime,
      endTime: currentTime + process.burstTime,
    })

    currentTime += process.burstTime
    processResult.completionTime = currentTime
    processResult.turnaroundTime = processResult.completionTime - process.arrivalTime
    processResult.waitingTime = processResult.turnaroundTime - process.burstTime

    return processResult
  })

  const averageWaitingTime = results.reduce((sum, p) => sum + (p.waitingTime || 0), 0) / results.length
  const averageTurnaroundTime = results.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0) / results.length
  const averageResponseTime = results.reduce((sum, p) => sum + (p.responseTime || 0), 0) / results.length

  return {
    processes: results,
    ganttChart,
    averageWaitingTime,
    averageTurnaroundTime,
    averageResponseTime,
    totalTime: currentTime,
  }
}
