import { getChapter, getCourse, getTask } from '@/lib/db'
import Task from './task'
import SimpleBreadcrumb from '@/components/ui/simple-breadcrumb'
import { getTemplate } from '@/lib/get-template'

interface PageProps {
    params: Promise<{ courseId: string, chapterId: string, taskId: string }>
}

export default async function Page({ params }: PageProps) {
    const { courseId, chapterId, taskId } = await params
    const task = await getTask(courseId, chapterId, taskId)
    const course = await getCourse(courseId)
    const chapter = await getChapter(courseId, chapterId)
    const template = await getTemplate(task.presetName)

    if (!task) {
        return <div>Task not found!</div>
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
            
            <Task task={task} template={template} />
        </div>
    )
}