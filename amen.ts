import { value } from './value.ts'
import { Sequence, stepIndex } from './sequence.ts'

import asset from './asset.ts'

const _amen = (
  sequence: Sequence,
  numSlices = 16,
  ac: AudioContext = new AudioContext(),
  startAt = -1,
  onPosition: (position: [number, number, boolean]) => void = () => {},
): [() => void, (newSequence: Sequence) => void] => {
  const content = new Uint8Array(asset.files.amen.content)
  const gain = ac.createGain()
  const history: [number, number, boolean][] = []

  let currentTime = startAt !== -1 ? startAt : ac.currentTime
  let timeoutId: number
  let cumulativeIndex = 0

  gain.connect(ac.destination)
  ac.decodeAudioData(content.buffer, (audioBuffer) => {
    const sliceDuration = audioBuffer.duration / numSlices
    const onended = () => {
      const item = history.shift()

      if (typeof item !== 'undefined') {
        onPosition(item)
      }
    }

    const schedule = () => {
      if (currentTime <= ac.currentTime + 0.2) {
        let duration = 0
        const n = typeof sequence === 'function' ? numSlices : sequence.length

        for (let x = 0; x < 3; x++) {
          let i = cumulativeIndex % n
          const si = typeof sequence === 'function'
            ? stepIndex(i, sequence({ index: i, cumulativeIndex, numSlices }))
            : stepIndex(i, sequence[i]) % sequence.length
          const step = typeof sequence === 'function'
            ? sequence({ index: si, cumulativeIndex, numSlices })
            : sequence[si]
          const stepDuration = sliceDuration *
            (step.duration ? value(step.duration, si) : 1.0)
          const source = ac.createBufferSource()
          const stepLength = stepDuration *
            (step.length ? value(step.length, si) : 1.0)
          const stepSliceIndex = value(step.sliceIndex, si)
          const stepStart = stepDuration *
            (step.start ? value(step.start, si) : 0)
          const stepWhen = currentTime + duration
          const offset = ((sliceDuration * stepSliceIndex) + stepStart) %
            audioBuffer.duration
          const doLoop = step.loop && stepLength < 1.0 && step.loop.length &&
            Math.random() < value(step.loop?.prob || 1.0, si)

          if (step.hop) {
            if (Math.random() < value(step.hop.prob, si)) {
              i = value(step.hop.index, si)

              continue
            }
          }

          if (stepLength > 0) {
            history.push([
              offset / audioBuffer.duration,
              stepLength / audioBuffer.duration,
              false,
            ])

            if (cumulativeIndex === 0) {
              onended()
            }

            source.buffer = audioBuffer
            source.loop = true
            source.connect(gain)
            source.start(
              stepWhen,
              offset,
              stepLength,
            )

            if (stepDuration > stepLength && !doLoop) {
              // insert silence (do not connect to gain) to proceed
              const source = ac.createBufferSource()

              source.buffer = audioBuffer
              source.loop = true
              source.start(
                stepWhen + stepLength,
                offset + stepLength,
                stepDuration - stepLength,
              )
              source.onended = onended
            } else {
              source.onended = onended
            }
          }

          // loop
          if (
            doLoop && step.loop?.length
          ) {
            const stepLoopLength = stepDuration * value(step.loop.length, si)
            const source = ac.createBufferSource()
            const loopStart = (offset + stepLength) % audioBuffer.duration
            const loopEnd = loopStart + stepLoopLength

            const durationOnHistory = Math.min(
              loopEnd - loopStart,
              stepDuration - stepLength,
            )
            history.push([
              loopStart / audioBuffer.duration,
              durationOnHistory / audioBuffer.duration,
              true,
            ])

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

            source.onended = onended
          }

          duration += stepDuration
          cumulativeIndex++
        }

        currentTime += duration
      }

      timeoutId = setTimeout(
        schedule,
        100,
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

export const amen = (
  sequences: Sequence[],
  numSlices = 16,
  ac: AudioContext = new AudioContext(),
  onPosition: (position: [number, number, number, boolean]) => void = () => {},
): [() => void, (newSequence: Sequence) => void] => {
  const startAt = ac.currentTime
  const stopFns: (() => void)[] = []
  const newSequenceFns: ((seq: Sequence) => void)[] = []

  sequences.forEach((sequence, i) => {
    const [stopFn, newSequenceFn] = _amen(
      sequence,
      numSlices,
      ac,
      startAt,
      ([start, length, loop]) => {
        onPosition([i, start, length, loop])
      },
    )

    stopFns.push(stopFn)
    newSequenceFns.push(newSequenceFn)
  })

  return [() => {
    stopFns.forEach((fn) => fn())
  }, (seq: Sequence) => {
    newSequenceFns.forEach((fn) => fn(seq))
  }]
}
