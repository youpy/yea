import asset from './asset.ts'

type ArrayOneOrMore<T> = {
  0: T
} & Array<T>

type Sequence = Step[]

type Value =
  | {
    type: 'rand'
    value: [Value, Value]
  }
  | {
    type: 'pick'
    value: ArrayOneOrMore<Value>
  }
  | {
    type: 'seq'
    value: ArrayOneOrMore<Value>
  }
  | number

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

const value = (v: Value): number => {
  if (typeof v === 'number') {
    return v
  }

  if (v.type === 'rand') {
    return value(v.value[0]) +
      Math.random() * (value(v.value[1]) - value(v.value[0]))
  } else if (v.type === 'seq') {
    const val = v.value[0]

    v.value.shift()
    v.value.push(val)

    return value(val)
  }

  return value(v.value[Math.floor(Math.random() * v.value.length)])
}

const stepIndex = (index: number, step: Step): number => {
  if (step.swap) {
    const swapWith = value(step.swap.index)
    const swapProb = value(step.swap.prob)

    if (Math.random() < swapProb) {
      return Math.floor(swapWith)
    }
  }

  return index
}

const numSlices = 16

export const amen = (
  sequence: Sequence,
): [() => void, (newSequence: Sequence) => void] => {
  console.log(JSON.stringify(sequence, undefined, ' '))

  const content = new Uint8Array(asset.files.amen.content)
  const ac = new AudioContext()
  const gain = ac.createGain()

  let currentTime = ac.currentTime
  let timeoutId: number

  gain.connect(ac.destination)
  ac.decodeAudioData(content.buffer, function (audioBuffer) {
    const sliceDuration = audioBuffer.duration / numSlices
    const schedule = () => {
      console.log(ac.currentTime)

      let duration = 0

      for (let i = 0; i < sequence.length; i++) {
        const step = sequence[stepIndex(i, sequence[i])]
        const stepDuration = sliceDuration *
          (step.duration ? value(step.duration) : 1.0)
        const source = ac.createBufferSource()
        const stepLength = stepDuration *
          (step.length ? value(step.length) : 1.0)
        const stepSliceIndex = value(step.sliceIndex)
        const stepStart = stepDuration * (step.start ? value(step.start) : 1.0)
        const stepWhen = currentTime + duration
        const offset = ((sliceDuration * stepSliceIndex) + stepStart) %
          audioBuffer.duration

        if (step.hop) {
          if (Math.random() < value(step.hop.prob)) {
            i = value(step.hop.index)

            continue
          }
        }

        if (stepLength > 0) {
          source.buffer = audioBuffer
          source.loop = true
          source.connect(gain)
          source.start(
            stepWhen,
            offset,
            stepLength,
          )
        }

        // loop
        if (
          step.loop && stepLength < 1.0 && step.loop.length &&
          Math.random() < value(step.loop.prob)
        ) {
          const stepLoopLength = stepDuration * value(step.loop.length)
          const source = ac.createBufferSource()
          const loopStart = (offset + stepLength) % audioBuffer.duration
          const loopEnd = loopStart + stepLoopLength

          source.buffer = audioBuffer
          source.loop = true
          source.loopStart = loopStart
          source.loopEnd = loopEnd
          source.connect(gain)
          source.start(
            stepWhen + stepLength,
            loopStart,
            stepDuration - stepLength,
          )
        }

        duration += stepDuration
      }

      currentTime += duration

      timeoutId = setTimeout(
        schedule,
        duration * 0.90 * 1000,
      )
    }

    schedule()
  })

  return [() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    gain.disconnect()
  }, (newSequence: Sequence) => {
    sequence = newSequence
  }]
}

export const randomSequence = (): Sequence => {
  return Array.from({ length: numSlices }, (_, index) => ({
    sliceIndex: index,
    length: {
      type: 'pick',
      value: [0.0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
    loop: {
      length: { type: 'pick', value: [1, 1 / 2, 1 / 4] },
      prob: 1,
    },
    swap: {
      index: {
        type: 'pick',
        value: [
          Math.floor(Math.random() * numSlices),
          Math.max(index - 4, 0),
          Math.max(index - 6, 0),
          Math.max(index - 2, 0),
          Math.max(index - 1, 0),
          Math.min(index + 4, numSlices - 1),
          Math.min(index + 6, numSlices - 1),
          Math.min(index + 2, numSlices - 1),
          Math.min(index + 1, numSlices - 1),
        ],
      },
      prob: 0.4,
    },
    hop: {
      index: {
        type: 'pick',
        value: [
          Math.max(index - 6, 0),
          Math.max(index - 4, 0),
          Math.max(index - 2, 0),
          Math.max(index - 1, 0),
        ],
      },
      prob: 0.75,
    },
  }))
}
