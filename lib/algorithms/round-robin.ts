import type { Process, SchedulingResult, GanttItem } from "../types"

export function roundRobinScheduling(processes: Process[], timeQuantum = 2, isPreemptive = true): SchedulingResult {
  const processQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const readyQueue: Process[] = []
  const ganttChart: GanttItem[] = []
  const results: Process[] = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    responseTime: -1,
  }))

  let currentTime = 0
  let processIndex = 0

  // Add first process to ready queue
  if (processQueue.length > 0) {
    readyQueue.push(results.find((p) => p.id === processQueue[0].id)!)
    processIndex = 1
  }

  while (readyQueue.length > 0 || processIndex < processQueue.length) {
    // Add newly arrived processes to ready queue
    while (processIndex < processQueue.length && processQueue[processIndex].arrivalTime <= currentTime) {
      readyQueue.push(results.find((p) => p.id === processQueue[processIndex].id)!)
      processIndex++
    }

    if (readyQueue.length === 0) {
      // No process ready, advance time to next arrival
      if (processIndex < processQueue.length) {
        ganttChart.push({
          processId: "IDLE",
          startTime: currentTime,
          endTime: processQueue[processIndex].arrivalTime,
          isIdle: true,
        })
        currentTime = processQueue[processIndex].arrivalTime
      }
      continue
    }

    const currentProcess = readyQueue.shift()!

    // Set response time if first execution
    if (currentProcess.responseTime === -1) {
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    const executionTime = Math.min(timeQuantum, currentProcess.remainingTime!)

    ganttChart.push({
      processId: currentProcess.id,
      startTime: currentTime,
      endTime: currentTime + executionTime,
    })

    currentTime += executionTime
    currentProcess.remainingTime! -= executionTime

    // Add newly arrived processes before checking if current process is done
    while (processIndex < processQueue.length && processQueue[processIndex].arrivalTime <= currentTime) {
      readyQueue.push(results.find((p) => p.id === processQueue[processIndex].id)!)
      processIndex++
    }

    if (currentProcess.remainingTime! > 0) {
      readyQueue.push(currentProcess)
    } else {
      currentProcess.completionTime = currentTime
      currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime
      currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime
    }
  }

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
