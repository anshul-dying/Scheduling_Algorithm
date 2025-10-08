import type { Process, SchedulingResult, GanttItem } from "../types"

export function priorityScheduling(
  processes: Process[],
  isPreemptive = false,
  priorityHighIsMin: boolean = true
): SchedulingResult {
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

  if (isPreemptive) {
    // Preemptive Priority Scheduling
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

      // Select process with highest priority (min or max based on config)
      const nextProcess = readyProcesses.reduce((best, current) => {
        if (current.priority == null || best.priority == null) return best
        return priorityHighIsMin
          ? (current.priority < best.priority ? current : best)
          : (current.priority > best.priority ? current : best)
      })

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
          endTime: currentTime + 1,
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
  } else {
    // Non-preemptive Priority Scheduling
    const remainingProcesses = [...results]

    while (remainingProcesses.length > 0) {
      // Get all processes that have arrived by current time
      const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime)

      if (availableProcesses.length === 0) {
        // No process available, jump to next arrival time
        const nextArrival = Math.min(...remainingProcesses.map((p) => p.arrivalTime))
        ganttChart.push({
          processId: "IDLE",
          startTime: currentTime,
          endTime: nextArrival,
          isIdle: true,
        })
        currentTime = nextArrival
        continue
      }

      // Select process with highest priority (min or max based on config)
      const selectedProcess = availableProcesses.reduce((best, current) => {
        if (current.priority == null || best.priority == null) return best
        return priorityHighIsMin
          ? (current.priority < best.priority ? current : best)
          : (current.priority > best.priority ? current : best)
      })

      // Remove selected process from remaining processes
      const processIndex = remainingProcesses.findIndex((p) => p.id === selectedProcess.id)
      remainingProcesses.splice(processIndex, 1)

      // Execute the process
      selectedProcess.startTime = currentTime
      selectedProcess.responseTime = currentTime - selectedProcess.arrivalTime

      ganttChart.push({
        processId: selectedProcess.id,
        startTime: currentTime,
        endTime: currentTime + selectedProcess.burstTime,
      })

      currentTime += selectedProcess.burstTime
      selectedProcess.completionTime = currentTime
      selectedProcess.turnaroundTime = selectedProcess.completionTime - selectedProcess.arrivalTime
      selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime
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
}
