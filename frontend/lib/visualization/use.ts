import { ArrayOrder } from "./ArrayVisualizer"
import { ArrayWatcher } from "./ArrayWatcher"

const analysis = {} as any

const array = new ArrayWatcher(analysis, 'array')
const listBehaviour = new ArrayOrder(array)

console.log(listBehaviour.getFullList())