import { Value, value } from './value.ts'

export type SequenceFnProps = {
  index: number
  cumulativeIndex: number
  numSlices: number
}
export type SequenceFn = (
  props: SequenceFnProps,
) => Step
export type Sequence =
  | Step[]
  | SequenceFn

interface Step {
  sliceIndex: Value
  length?: Value // 0.0 - 1.0
  duration?: Value // 0.0 - 1.0
  start?: Value // 0.0 - 1.0
  loop?: {
    prob?: Value // 0.0 - 1.0
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

export const example: SequenceFn = ({
  cumulativeIndex,
}: SequenceFnProps) => {
  const sliceIndex = Math.floor(
    (Math.sin(Math.sin(cumulativeIndex / 0.098)) * 0.5 +
      0.5) * 16,
  )

  return {
    sliceIndex,
    length: sliceIndex % 4 === 1 ? 0.001 : 1,
    loop: {
      prob: 1,
      length: 1 / ((sliceIndex % 3) + 1),
    },
  }
}
