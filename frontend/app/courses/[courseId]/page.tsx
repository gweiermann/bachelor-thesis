import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getCourse } from "@/lib/db"
import SimpleBreadcrumb from "@/components/ui/simple-breadcrumb"

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const {courseId} = await params
  const course = await getCourse(courseId)

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <SimpleBreadcrumb items={[
        { label: course.title, href: `/courses/${courseId}` }
      ]} />

      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      <p className="text-muted-foreground mb-8">Select a chapter to continue your learning journey</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {course.chapters.map((chapter) => (
          <Link
            href={`/courses/${courseId}/${chapter.id}`}
            key={chapter.id}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{chapter.title}</CardTitle>
                <CardDescription>
                  {chapter.progress === 0 ? "Not started yet" : chapter.progress === 100 ? "Completed" : "In progress"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{chapter.progress}%</span>
                  </div>
                  <Progress value={chapter.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
