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
import { srtScheduling } from "./algorithms/srt"
import { feedbackScheduling } from "./algorithms/feedback"
import { feedbackVaryingScheduling } from "./algorithms/feedback-varying"
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

    case "SPN":
      return spnScheduling(processes)

    case "SRT":
      return srtScheduling(processes)

    case "FB":
      return feedbackScheduling(processes, config.numberOfQueues || 3)

    case "FBV":
      return feedbackVaryingScheduling(processes, config.numberOfQueues || 3, config.quantumMultiplier || 2)

    case "PRIORITY":
      return priorityScheduling(processes, config.isPreemptive || false)

    default:
      throw new Error(`Unknown scheduling algorithm: ${algorithm}`)
  }
}

export const algorithmNames: Record<SchedulingAlgorithm, string> = {
  FCFS: "First Come First Serve",
  RR: "Round Robin",
  SPN: "Shortest Process Next",
  SRT: "Shortest Remaining Time",
  FB: "Feedback",
  FBV: "Feedback with Varying Quantum",
  PRIORITY: "Priority Scheduling",
}

export const algorithmDescriptions: Record<SchedulingAlgorithm, string> = {
  FCFS: "Non-preemptive algorithm that processes jobs in order of arrival",
  RR: "Preemptive algorithm with fixed time quantum for fair CPU sharing",
  SPN: "Non-preemptive algorithm that selects the shortest job first",
  SRT: "Preemptive version of SPN that can switch to shorter jobs",
  FB: "Multi-level queue with priority degradation over time",
  FBV: "Feedback scheduling with varying time quantum per queue level",
  PRIORITY: "Schedules processes based on priority values (lower number = higher priority)",
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
