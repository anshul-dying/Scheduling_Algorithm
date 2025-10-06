import type {
  Process,
  SchedulingResult,
  SchedulingAlgorithm,
  AlgorithmConfig,
  QueueAnimation,
  QueueSnapshot,
} from "./types"
import { fcfsScheduling } from "./algorithms/fcfs"
import { roundRobinScheduling } from "./algorithms/round-robin"
import { spnScheduling } from "./algorithms/spn"
// Removed SRT/FB/FBV from exported algorithms
import { priorityScheduling } from "./algorithms/priority"

export function runSchedulingAlgorithm(
  algorithm: SchedulingAlgorithm,
  processes: Process[],
  config: AlgorithmConfig = {},
): SchedulingResult {
  switch (algorithm) {
    case "FCFS":
      return fcfsScheduling(processes)

    case "RR":
      return roundRobinScheduling(processes, config.timeQuantum || 2)

    case "SJF":
      return spnScheduling(processes)

    case "PRIORITY":
      return priorityScheduling(processes, config.isPreemptive || false, config.priorityHighIsMin !== false)

    default:
      throw new Error(`Unknown scheduling algorithm: ${algorithm}`)
  }
}

export const algorithmNames: Record<SchedulingAlgorithm, string> = {
  FCFS: "First Come First Serve",
  RR: "Round Robin",
  SJF: "Shortest Job First",
  PRIORITY: "Priority Scheduling",
}

export const algorithmDescriptions: Record<SchedulingAlgorithm, string> = {
  FCFS: "Processes jobs in order of arrival (non-preemptive)",
  RR: "Fixed time quantum for fair CPU sharing (preemptive)",
  SJF: "Selects the shortest job first (non-preemptive)",
  PRIORITY: "Schedules based on priority; choose min or max as highest",
}

export function generateQueueAnimation(
  algorithm: SchedulingAlgorithm,
  processes: Process[],
  config: AlgorithmConfig = {},
): QueueAnimation {
  const result = runSchedulingAlgorithm(algorithm, processes, config)
  const snapshots: QueueSnapshot[] = []

  // Generate snapshots based on Gantt chart
  const currentTime = 0
  const processMap = new Map(result.processes.map((p) => [p.id, p]))

  for (const ganttItem of result.ganttChart) {
    // Create snapshot at start of each time slice
    const readyQueue: Process[] = []
    const waitingProcesses: Process[] = []
    const completedProcesses: Process[] = []

    for (const process of result.processes) {
      if (process.arrivalTime <= ganttItem.startTime) {
        if (process.completionTime && process.completionTime <= ganttItem.startTime) {
          completedProcesses.push(process)
        } else if (process.id !== ganttItem.processId) {
          readyQueue.push(process)
        }
      } else {
        waitingProcesses.push(process)
      }
    }

    snapshots.push({
      time: ganttItem.startTime,
      readyQueue,
      runningProcess: ganttItem.isIdle ? null : processMap.get(ganttItem.processId) || null,
      completedProcesses,
      waitingProcesses,
    })
  }

  return {
    snapshots,
    totalTime: result.totalTime,
    algorithm,
  }
}
