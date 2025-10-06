import type { Process, SchedulingResult, GanttItem } from "../types"

export function feedbackScheduling(processes: Process[], numberOfQueues = 3): SchedulingResult {
  const processQueue = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const queues: Process[][] = Array.from({ length: numberOfQueues }, () => [])
  const results: Process[] = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    responseTime: -1,
    priority: 0, // Start at highest priority queue
  }))
  const ganttChart: GanttItem[] = []

  let currentTime = 0
  let processIndex = 0

  while (processIndex < processQueue.length || queues.some((q) => q.length > 0)) {
    // Add newly arrived processes to highest priority queue (queue 0)
    while (processIndex < processQueue.length && processQueue[processIndex].arrivalTime <= currentTime) {
      const process = results.find((p) => p.id === processQueue[processIndex].id)!
      process.priority = 0
      queues[0].push(process)
      processIndex++
    }

    // Find highest priority non-empty queue
    let currentQueueIndex = -1
    for (let i = 0; i < numberOfQueues; i++) {
      if (queues[i].length > 0) {
        currentQueueIndex = i
        break
      }
    }

    if (currentQueueIndex === -1) {
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
      continue
    }

    const currentProcess = queues[currentQueueIndex].shift()!

    // Set response time if first execution
    if (currentProcess.responseTime === -1) {
      currentProcess.responseTime = currentTime - currentProcess.arrivalTime
    }

    // Time quantum increases with queue level (1, 2, 4, 8, ...)
    const timeQuantum = Math.pow(2, currentQueueIndex)
    const executionTime = Math.min(timeQuantum, currentProcess.remainingTime!)

    ganttChart.push({
      processId: currentProcess.id,
      startTime: currentTime,
      endTime: currentTime + executionTime,
    })

    currentTime += executionTime
    currentProcess.remainingTime! -= executionTime

    // Add newly arrived processes during execution
    while (processIndex < processQueue.length && processQueue[processIndex].arrivalTime <= currentTime) {
      const process = results.find((p) => p.id === processQueue[processIndex].id)!
      process.priority = 0
      queues[0].push(process)
      processIndex++
    }

    if (currentProcess.remainingTime! > 0) {
      // Move to next lower priority queue (higher index)
      const nextQueueIndex = Math.min(currentQueueIndex + 1, numberOfQueues - 1)
      currentProcess.priority = nextQueueIndex
      queues[nextQueueIndex].push(currentProcess)
    } else {
      // Process completed
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
