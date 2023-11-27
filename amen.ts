import { value } from './value.ts'
import { Sequence, stepIndex } from './sequence.ts'

import asset from './asset.ts'

export const amen = (
  sequence: Sequence,
  numSlices = 16,
): [() => void, (newSequence: Sequence) => void] => {
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
      const n = typeof sequence === 'function' ? numSlices : sequence.length

      for (let i = 0; i < n; i++) {
        const si = typeof sequence === 'function'
          ? stepIndex(i, sequence(i))
          : stepIndex(i, sequence[i]) % sequence.length
        const step = typeof sequence === 'function'
          ? sequence(si)
          : sequence[si]
        const stepDuration = sliceDuration *
          (step.duration ? value(step.duration, si) : 1.0)
        const source = ac.createBufferSource()
        const stepLength = stepDuration *
          (step.length ? value(step.length, si) : 1.0)
        const stepSliceIndex = value(step.sliceIndex, si)
        const stepStart = stepDuration *
          (step.start ? value(step.start, si) : 1.0)
        const stepWhen = currentTime + duration
        const offset = ((sliceDuration * stepSliceIndex) + stepStart) %
          audioBuffer.duration

        if (step.hop) {
          if (Math.random() < value(step.hop.prob, si)) {
            i = value(step.hop.index, si)

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
          Math.random() < value(step.loop.prob, si)
        ) {
          const stepLoopLength = stepDuration * value(step.loop.length, si)
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
