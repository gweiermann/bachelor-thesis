import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Home } from "lucide-react"
import { getChapter, getCourse } from "@/lib/db"
import SimpleBreadcrumb from "@/components/ui/simple-breadcrumb"

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>
}) {
  const { courseId, chapterId } = await params
  const course = await getCourse(courseId)

  if (!course) {
    return <div>Course not found</div>
  }

  const chapter = await getChapter(courseId, chapterId)

  if (!chapter) {
    return <div>Chapter not found</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">

      <SimpleBreadcrumb items={[
        { label: course.title, href: `/courses/${courseId}` },
        { label: chapter.title, href: `/courses/${courseId}/${chapterId}` }
      ]} />

      <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
      <p className="text-muted-foreground mb-8">Complete the following tasks to master this chapter</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapter.tasks.map((task) => (
          <Link
            href={`/courses/${courseId}/${chapterId}/${task.id}`}
            key={task.id}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <TaskStatusBadge status={task.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {task.status === "completed"
                    ? "You've completed this task!"
                    : task.status === "in-progress"
                      ? "Continue where you left off"
                      : "Start this task"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TaskStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
    case "in-progress":
      return <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>
    case "not-started":
    default:
      return <Badge variant="outline">Not Started</Badge>
  }
}
