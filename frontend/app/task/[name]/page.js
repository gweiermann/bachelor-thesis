
import { getTask } from '@/lib/tasks'
import Task from './task'

export default async function Page({ params }) {
    const { name } = await params
    const task = await getTask(name)

    if (!task) {
        return <div>Task not found!</div>
    }

    return <Task task={task} />
   
}