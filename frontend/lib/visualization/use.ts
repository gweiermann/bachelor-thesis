import { List } from "./List"
import { ListEvents } from "./ListEvents"
import { ListOrders } from "./ListOrders"

const analysis = {} as any

const array = new List(analysis as any, 'array')
const events = new ListEvents(array)
const order = new ListOrders(events)
console.log([...array.getFullList()])
console.log([...events.getFullList()])
console.log([...order.getFullList()])