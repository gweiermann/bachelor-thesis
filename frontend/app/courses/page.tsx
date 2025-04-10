import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function Home() {
  // Mock data for courses
  const courses = [
    {
      id: "gip",
      title: "Grundlagen in Programmiersprachen (GIP)",
      description: "Learn the fundamentals of programming languages",
      progress: 65,
    },
    {
      id: "ads",
      title: "Algorithmen und Datenstrukturen (ADS)",
      description: "Master algorithms and data structures",
      progress: 30,
    },
    {
      id: "db",
      title: "Datenbanken",
      description: "Introduction to database systems and SQL",
      progress: 80,
    },
    {
      id: "os",
      title: "Betriebssysteme",
      description: "Understanding operating systems concepts",
      progress: 45,
    },
  ]

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            href={`/courses/${course.id}`}
            key={course.id}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <span className="text-sm text-muted-foreground">
                  {course.progress < 50
                    ? "Just getting started"
                    : course.progress < 80
                      ? "Making good progress"
                      : "Almost complete"}
                </span>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
