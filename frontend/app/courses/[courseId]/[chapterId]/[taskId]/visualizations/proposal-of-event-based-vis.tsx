/**
 * notes:
 * - visualization prop should be exposed as context
 * - it is allowed to change the wordings
 * - this is just a proof of concept and may need some changes to work. It can be considered as some kind of prototype pseudo code
 */

export function SortVisualization({ visualization, steps }) {
    const arrayVis = useArrayChangesVisualization(visualization);

    steps.once('arrayWatcher', (array) => arrayVis.setItems(array), { ungrouped: true }) // if it is a group with 2+ items, a console.error is thrown, always exposes first item

    steps.chunked('arrayWatcher', 2, ([ array, array2 ]) => {
        const comparison = compareArrays(array, array2)
        if (comparison.reason === 'swap') {
            visualization.group(-1, 0) // previous and current (the current chunk basically)
            arrayVis.swap(comparison.firstIndex, comparison.secondIndex) // swap event references this whole group as one step 
        }
        else if (comparison.reason === 'replace') {
            arrayVis.replace(comparison.index, comparison.newValue)
        }
        else {
            throw new Error(`Unknown comparison reason: ${comparison.reason}`)
        }
    })

    return (
        <ArrayChangesVisualization timeline={arrayVis} />
    )
}

export function useItemsVisualization(visualization) {
    const [current, set] = useTimeline(visualization)
    const [id, setId] = useState(0)
    
    return {
        current,
        visualizationInstance: visualization,
        set: (rawItems) => {
            setId(id => id + 1)
            set(rawItems.map((num, index) => ({
                value: num,
                id,
                orderId: index,
                classList: []
            })))
        },
        swap: (index1, index2) => {
            set((current) => {
            const temp = current[index1]
                current[index1] = current[index2]
                current[index2] = temp
                return current
            })
        },
        replace: (index, newValue) => {
            set((current) => {
                current[index].value = newValue
                setId(id => id + 1)
                current[index].id = id
                return current
            })
        },
        addClass: (index, className) => {
            set((current) => {
                current[index].classList.push(className)
                return current
            })
        },
        removeClass: (index, className) => {
            set((current) => {
                current[index].classList = current[index].classList.filter(cls => cls !== className)
                return current
            })
        }
    }
}

export function ArrayChangesVisualization({ timeline }) {
    const itemsVis = useItemsVisualization(timeline.visualizationInstance)
    timeline.on('set', (array) => itemsVis.set(array))
    timeline.on('swap', (index1, index2) => itemsVis.swap(index1, index2))
    timeline.on('replace', (index, newValue) => itemsVis.replace(index, newValue))

    const swapClass = 'bg-sky-200 animate-wiggle'
    const replaceClass = 'bg-amber-400 animate-wiggle'
    
    timeline.before('swap', (index1, index2) => {
        itemsVis.addClass(index1, swapClass)
        itemsVis.addClass(index2, swapClass)
    })
    // after needs to make sure to run before the next 'before' handler so if two swaps happen in a row, addClass will be called after the removeClass
    timeline.after('swap', (index1, index2) => {
        itemsVis.removeClass(index1, swapClass)
        itemsVis.removeClass(index2, swapClass)
    })

    timeline.before('replace', (index, newValue) => {
        itemsVis.addClass(index, replaceClass)  
    })
    timeline.after('replace', (index, newValue) => {
        itemsVis.removeClass(index, replaceClass)
    })

    // with motion.js like in sort.tsx, animatepresence and so on
    return (
        <ItemsVisualization timeline={itemsVis} />
    )
}

export function ItemsVisualization({ timeline }) {
    const current = timeline.current
    return (
        <ul className="flex space-x-4">
            {current.map((item, index) => 
                <motion.li
                    key={item.orderId}
                    layout
                    transition={{
                        duration: timeline.visualizationInstance.timePerStep,
                        type: 'spring',
                        bounce: 0.25
                    }}
                    className="size-16"
                    >
                    <motion.div
                        initial={{ y: -50, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{type: 'spring', duration: 0.05, delay: 0.05 * index}}
                        className="relative size-full">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={item.id}
                                transition={{ type: 'spring', duration: timeline.visualizationInstance.timePerStep }}
                                initial={{ y: -100, opacity: 0, scale: 0.5 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 100, opacity: 0, scale: 0.5 }}
                                className={cn(
                                    "absolute size-full border-2 border-black bg-white rounded-sm flex items-center justify-center",
                                    ...item.classList
                                )}>
                                {item.value}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </motion.li>
            )}
        </ul>
    )
}