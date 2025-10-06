import type { Process, SchedulingResult, GanttItem } from "../types"

export function spnScheduling(processes: Process[]): SchedulingResult {
  const remainingProcesses = [...processes].map((p) => ({ ...p }))
  const ganttChart: GanttItem[] = []
  const results: Process[] = []
  let currentTime = 0

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

    // Select process with shortest burst time
    const selectedProcess = availableProcesses.reduce((shortest, current) =>
      current.burstTime < shortest.burstTime ? current : shortest,
    )

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

    results.push(selectedProcess)
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
