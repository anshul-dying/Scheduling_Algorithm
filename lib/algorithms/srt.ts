import type { Process, SchedulingResult, GanttItem } from "../types"

export function srtScheduling(processes: Process[]): SchedulingResult {
  const processQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const results: Process[] = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    responseTime: -1,
  }))
  const ganttChart: GanttItem[] = []

  let currentTime = 0
  let processIndex = 0
  let currentProcess: Process | null = null

  while (processIndex < processQueue.length || currentProcess !== null) {
    // Add all processes that have arrived by current time
    const readyProcesses: Process[] = []

    while (processIndex < processQueue.length && processQueue[processIndex].arrivalTime <= currentTime) {
      const process = results.find((p) => p.id === processQueue[processIndex].id)!
      if (process.remainingTime! > 0) {
        readyProcesses.push(process)
      }
      processIndex++
    }

    // Add current process to ready processes if it exists
    if (currentProcess && currentProcess.remainingTime! > 0) {
      readyProcesses.push(currentProcess)
    }

    if (readyProcesses.length === 0) {
      // No process ready, advance to next arrival
      if (processIndex < processQueue.length) {
        ganttChart.push({
          processId: "IDLE",
          startTime: currentTime,
          endTime: processQueue[processIndex].arrivalTime,
          isIdle: true,
        })
        currentTime = processQueue[processIndex].arrivalTime
      }
      currentProcess = null
      continue
    }

    // Select process with shortest remaining time
    const nextProcess = readyProcesses.reduce((shortest, current) =>
      current.remainingTime! < shortest.remainingTime! ? current : shortest,
    )

    // Check if we need to preempt
    if (currentProcess && currentProcess.id !== nextProcess.id) {
      // End current process execution in Gantt chart
      if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].processId === currentProcess.id) {
        ganttChart[ganttChart.length - 1].endTime = currentTime
      }
    }

    // Start new process or continue current one
    if (!currentProcess || currentProcess.id !== nextProcess.id) {
      // Set response time if first execution
      if (nextProcess.responseTime === -1) {
        nextProcess.responseTime = currentTime - nextProcess.arrivalTime
      }

      ganttChart.push({
        processId: nextProcess.id,
        startTime: currentTime,
        endTime: currentTime + 1, // Will be updated when process ends or is preempted
      })
    }

    currentProcess = nextProcess
    currentTime += 1
    currentProcess.remainingTime! -= 1

    // Update Gantt chart end time
    if (ganttChart.length > 0) {
      ganttChart[ganttChart.length - 1].endTime = currentTime
    }

    // Check if process is completed
    if (currentProcess.remainingTime === 0) {
      currentProcess.completionTime = currentTime
      currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
      currentProcess = null
    }
  }

  // Merge consecutive Gantt chart entries for the same process
  const mergedGanttChart: GanttItem[] = []
  for (const item of ganttChart) {
    const lastItem = mergedGanttChart[mergedGanttChart.length - 1]
    if (lastItem && lastItem.processId === item.processId && lastItem.endTime === item.startTime) {
      lastItem.endTime = item.endTime
    } else {
      mergedGanttChart.push(item)
    }
  }

  const averageWaitingTime = results.reduce((sum, p) => sum + (p.waitingTime || 0), 0) / results.length
  const averageTurnaroundTime = results.reduce((sum, p) => sum + (p.turnaroundTime || 0), 0) / results.length
  const averageResponseTime = results.reduce((sum, p) => sum + (p.responseTime || 0), 0) / results.length

  return {
    processes: results,
    ganttChart: mergedGanttChart,
    averageWaitingTime,
    averageTurnaroundTime,
    averageResponseTime,
    totalTime: currentTime,
  }
}
