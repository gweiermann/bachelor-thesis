import { List } from "./List"
import { ListEvents } from "./ListEvents"
import { ListItemEnrichment } from "./ListItemEnrichment"

const analysis = {} as any

const array = new List(analysis as any, 'array')
const events = new ListEvents(array)
const order = new ListItemEnrichment(events)
console.log([...array.getFullList()])
console.log([...events.getFullList()])
console.log([...order.getFullList()])