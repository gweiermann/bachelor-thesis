import { ArrayWatcher } from "./ArrayWatcher"

const analysis = {} as any

const array = new ArrayWatcher(analysis, 'array')
const listBehaviour = new ArrayVisualizer(array)