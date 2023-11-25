import { Value, value } from './value.ts'

export type Sequence = Step[] | ((index: number) => Step)

interface Step {
  sliceIndex: Value
  length?: Value // 0.0 - 1.0
  duration?: Value // 0.0 - 1.0
  start?: Value // 0.0 - 1.0
  loop?: {
    prob: Value // 0.0 - 1.0
    length?: Value // 0.0 - 1.0
  }
  swap?: {
    index: Value
    prob: Value
  }
  hop?: {
    index: Value
    prob: Value
  }
}

export const stepIndex = (index: number, step: Step): number => {
  if (step.swap) {
    const swapWith = value(step.swap.index, index)
    const swapProb = value(step.swap.prob, index)

    if (Math.random() < swapProb) {
      return Math.floor(swapWith)
    }
  }

  return index
}
