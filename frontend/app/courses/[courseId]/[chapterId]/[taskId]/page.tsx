import { getTask } from '@/lib/db'
import Task from './task'
import SimpleBreadcrumb from '@/components/ui/simple-breadcrumb'

interface PageProps {
    params: Promise<{ courseId: string, chapterId: string, taskId: string }>
}

export default async function Page({ params }: PageProps) {
    const { courseId, chapterId, taskId } = await params
    const task = await getTask(courseId, chapterId, taskId)

    if (!task) {
        return <div>Task not found!</div>
    }

    const course = {
        title: 'Course Title', // FIXME: Replace with actual course title
    }

    const chapter = {
        title: 'Chapter Title', // FIXME: Replace with actual chapter title
    }

    return (
        <div>
            <div className="mx-4 mt-4">
                <SimpleBreadcrumb items={[
                    { label: course.title, href: `/courses/${courseId}` },
                    { label: chapter.title, href: `/courses/${courseId}/${chapterId}` },
                    { label: task.title, href: `/courses/${courseId}/${chapterId}/${taskId}` }
                ]} />
            </div>
            
            <Task task={task} />
        </div>
    )
}