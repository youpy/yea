type ArrayOneOrMore<T> = {
  0: T
} & Array<T>

export type Value =
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

export const value = (v: Value, index: number): number => {
  if (typeof v === 'number') {
    return v
  }

  if (v.type === 'rand') {
    return value(v.value[0], index) +
      Math.random() * (value(v.value[1], index) - value(v.value[0], index))
  } else if (v.type === 'seq') {
    return value(v.value[index % v.value.length], index)
  }

  return value(v.value[Math.floor(Math.random() * v.value.length)], index)
}

export const seq = (values: ArrayOneOrMore<Value>): Value => {
  return {
    type: 'seq',
    value: values,
  }
}

export const pick = (values: ArrayOneOrMore<Value>): Value => {
  return {
    type: 'pick',
    value: values,
  }
}

export const rand = (from: Value, to: Value): Value => {
  return {
    type: 'rand',
    value: [from, to],
  }
}
