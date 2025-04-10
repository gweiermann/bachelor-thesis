import { getTask } from '@/lib/tasks'
import Task from './task'

interface PageProps {
    params: Promise<{ name: string }>
}

export default async function Page({ params }: PageProps) {
    const { name } = await params
    const task = await getTask(name)

    if (!task) {
        return <div>Task not found!</div>
    }

    return <Task task={task} />
}