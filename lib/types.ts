export interface Process {
  id: string
  arrivalTime: number
  burstTime: number
  priority?: number
  remainingTime?: number
  completionTime?: number
  turnaroundTime?: number
  waitingTime?: number
  responseTime?: number
  startTime?: number
}

export interface SchedulingResult {
  processes: Process[]
  ganttChart: GanttItem[]
  averageWaitingTime: number
  averageTurnaroundTime: number
  averageResponseTime: number
  totalTime: number
}

export interface GanttItem {
  processId: string
  startTime: number
  endTime: number
  isIdle?: boolean
}

export type SchedulingAlgorithm = "FCFS" | "RR" | "SPN" | "SRT" | "FB" | "FBV" | "PRIORITY"

export interface AlgorithmConfig {
  timeQuantum?: number
  numberOfQueues?: number
  quantumMultiplier?: number
  isPreemptive?: boolean
}

export interface QueueSnapshot {
  time: number
  readyQueue: Process[]
  runningProcess: Process | null
  completedProcesses: Process[]
  waitingProcesses: Process[]
  multilevelQueues?: Process[][] // For feedback algorithms
}

export interface QueueAnimation {
  snapshots: QueueSnapshot[]
  totalTime: number
  algorithm: SchedulingAlgorithm
}

export interface AnimationStep {
  time: number
  action: "arrive" | "start" | "preempt" | "complete" | "queue_move"
  processId: string
  fromQueue?: number
  toQueue?: number
  description: string
}
