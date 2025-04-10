import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight, Home } from "lucide-react"

// Mock data for courses and chapters
const coursesData = {
  gip: {
    title: "Grundlagen in Programmiersprachen (GIP)",
    chapters: [
      { id: "variables", title: "Variables and Data Types", progress: 100 },
      { id: "control-flow", title: "Control Flow", progress: 80 },
      { id: "functions", title: "Functions", progress: 60 },
      { id: "oop", title: "Object-Oriented Programming", progress: 40 },
      { id: "exceptions", title: "Exception Handling", progress: 20 },
    ],
  },
  ads: {
    title: "Algorithmen und Datenstrukturen (ADS)",
    chapters: [
      { id: "sorting", title: "Sorting", progress: 75 },
      { id: "sorting-recursion", title: "Sorting with Recursion", progress: 50 },
      { id: "trees", title: "Trees", progress: 30 },
      { id: "red-black-tree", title: "Red-Black Trees", progress: 10 },
      { id: "graphs", title: "Graphs", progress: 0 },
    ],
  },
  db: {
    title: "Datenbanken",
    chapters: [
      { id: "relational", title: "Relational Model", progress: 100 },
      { id: "sql", title: "SQL Basics", progress: 90 },
      { id: "normalization", title: "Normalization", progress: 85 },
      { id: "transactions", title: "Transactions", progress: 70 },
      { id: "nosql", title: "NoSQL Databases", progress: 60 },
    ],
  },
  os: {
    title: "Betriebssysteme",
    chapters: [
      { id: "processes", title: "Processes and Threads", progress: 90 },
      { id: "scheduling", title: "CPU Scheduling", progress: 70 },
      { id: "memory", title: "Memory Management", progress: 50 },
      { id: "file-systems", title: "File Systems", progress: 30 },
      { id: "io", title: "I/O Systems", progress: 0 },
    ],
  },
}

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId
  const course = coursesData[courseId as keyof typeof coursesData]

  if (!course) {
    return <div>Course not found</div>
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
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
      <p className="text-muted-foreground mb-8">Select a chapter to continue your learning journey</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {course.chapters.map((chapter) => (
          <Link
            href={`/courses/${courseId}/chapters/${chapter.id}`}
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
    </main>
  )
}
