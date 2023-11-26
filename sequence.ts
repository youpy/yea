import { pick, seq, Value, value } from './value.ts'

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

export const example: Sequence = (index: number) => {
  return {
    sliceIndex: index,
    length: pick([0.0, 1, 0.5, 1]),
    duration: seq([0.5, 1, 2, 3, 4, 5, 6]),
    loop: {
      length: seq([1, 1 / 2, 1 / 3, 1 / 4, 1 / 5]),
      prob: 1,
    },
  }
}
