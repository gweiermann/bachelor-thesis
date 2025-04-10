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

// Mock data for courses, chapters, and tasks
const coursesData = {
  gip: {
    title: "Grundlagen in Programmiersprachen (GIP)",
    chapters: {
      variables: {
        title: "Variables and Data Types",
        tasks: [
          { id: "integers", title: "Working with Integers", status: "completed" },
          { id: "floats", title: "Floating Point Numbers", status: "completed" },
          { id: "strings", title: "String Manipulation", status: "completed" },
          { id: "booleans", title: "Boolean Logic", status: "completed" },
        ],
      },
      "control-flow": {
        title: "Control Flow",
        tasks: [
          { id: "if-else", title: "If-Else Statements", status: "completed" },
          { id: "switch", title: "Switch Statements", status: "completed" },
          { id: "loops", title: "Loops", status: "in-progress" },
          { id: "break-continue", title: "Break and Continue", status: "not-started" },
        ],
      },
      // Other chapters...
    },
  },
  ads: {
    title: "Algorithmen und Datenstrukturen (ADS)",
    chapters: {
      sorting: {
        title: "Sorting",
        tasks: [
          { id: "bubble-sort", title: "Bubble Sort", status: "completed" },
          { id: "insertion-sort", title: "Insertion Sort", status: "completed" },
          { id: "selection-sort", title: "Selection Sort", status: "in-progress" },
          { id: "quick-sort", title: "Quick Sort", status: "not-started" },
          { id: "merge-sort", title: "Merge Sort", status: "not-started" },
        ],
      },
      "sorting-recursion": {
        title: "Sorting with Recursion",
        tasks: [
          { id: "recursive-quick-sort", title: "Recursive Quick Sort", status: "completed" },
          { id: "recursive-merge-sort", title: "Recursive Merge Sort", status: "in-progress" },
          { id: "heap-sort", title: "Heap Sort", status: "not-started" },
        ],
      },
      "red-black-tree": {
        title: "Red-Black Trees",
        tasks: [
          { id: "rb-insertion", title: "Red-Black Tree Insertion", status: "in-progress" },
          { id: "rb-deletion", title: "Red-Black Tree Deletion", status: "not-started" },
          { id: "rb-balancing", title: "Red-Black Tree Balancing", status: "not-started" },
        ],
      },
      // Other chapters...
    },
  },
  // Other courses...
}

export default function ChapterPage({
  params,
}: {
  params: { courseId: string; chapterId: string }
}) {
  const { courseId, chapterId } = params
  const course = coursesData[courseId as keyof typeof coursesData]

  if (!course) {
    return <div>Course not found</div>
  }

  const chapter = course.chapters[chapterId as keyof typeof course.chapters]

  if (!chapter) {
    return <div>Chapter not found</div>
  }

  return (
    <main className="container mx-auto py-8 px-4">
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
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
      <p className="text-muted-foreground mb-8">Complete the following tasks to master this chapter</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapter.tasks.map((task) => (
          <Link
            href={`/courses/${courseId}/chapters/${chapterId}/tasks/${task.id}`}
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
    </main>
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
