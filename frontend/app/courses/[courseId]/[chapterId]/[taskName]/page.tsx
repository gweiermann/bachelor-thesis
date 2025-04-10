import { getTask } from '@/lib/tasks'
import Task from './task'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home, ChevronRight } from 'lucide-react'

interface PageProps {
    params: Promise<{ taskName: string }>
}

export default async function Page({ params }: PageProps) {
    const { taskName } = await params
    const task = await getTask(taskName)

    if (!task) {
        return <div>Task not found!</div>
    }


    const courseId = 'course' // FIXME: Replace with actual courseId
    const chapterId = 'chapter' // FIXME: Replace with actual courseId
    const taskId = taskName // FIXME: Replace with actual taskId

    const course = {
        title: 'Course Title', // FIXME: Replace with actual course title
    }

    const chapter = {
        title: 'Chapter Title', // FIXME: Replace with actual chapter title
    }

    return (
        <div>
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">
                        <Home className="h-4 w-4 mr-1" />
                        Home
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/courses/${courseId}`}>{course.title}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/courses/${courseId}/chapters/${chapterId}`}>{chapter.title}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/courses/${courseId}/chapters/${chapterId}/tasks/${taskId}`}>
                        {task.title}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Task task={task} />
        </div>
    )
}