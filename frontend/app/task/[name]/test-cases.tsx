'use client'

import { useMemo, useState } from "react"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  CheckCircle2,
  CircleXIcon as XCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTests } from "./stores"
import { InlineLoadingSpinner } from "@/components/loading-spinner"

// Types for our test data
interface TestCase {
  id: string;
  name: string;
  status: "passed" | "failed";
  errorMessage?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testCases?: TestCase[];
}

// Mock data for demonstration
const testCases: Record<string, TestSuite> = {
  public: {
    name: "Public Tests",
    totalTests: 15,
    passedTests: 12,
    failedTests: 3,
    testCases: [
      {
        id: "p1",
        name: "Should return correct sum for array of positive numbers",
        status: "passed",
        duration: 12,
      },
      {
        id: "p2",
        name: "Should handle empty arrays",
        status: "passed",
        duration: 5,
      },
      {
        id: "p3",
        name: "Should handle single element arrays",
        status: "passed",
        duration: 4,
      },
      {
        id: "p4",
        name: "Should handle negative numbers",
        status: "failed",
        errorMessage: "Expected -5, got -3",
        duration: 8,
      },
      {
        id: "p5",
        name: "Should handle large arrays",
        status: "passed",
        duration: 15,
      },
      {
        id: "p6",
        name: "Should handle floating point numbers",
        status: "failed",
        errorMessage: "Precision error: Expected 10.5, got 10.499999",
        duration: 7,
      },
      {
        id: "p7",
        name: "Should handle mixed positive and negative numbers",
        status: "passed",
        duration: 6,
      },
      {
        id: "p8",
        name: "Should handle zero values",
        status: "passed",
        duration: 3,
      },
      {
        id: "p9",
        name: "Should handle array with all zeros",
        status: "passed",
        duration: 4,
      },
      {
        id: "p10",
        name: "Should handle very large numbers",
        status: "passed",
        duration: 9,
      },
      {
        id: "p11",
        name: "Should handle very small numbers",
        status: "passed",
        duration: 5,
      },
      {
        id: "p12",
        name: "Should handle edge case with MAX_SAFE_INTEGER",
        status: "passed",
        duration: 11,
      },
      {
        id: "p13",
        name: "Should handle edge case with MIN_SAFE_INTEGER",
        status: "failed",
        errorMessage: "Overflow error occurred",
        duration: 10,
      },
      {
        id: "p14",
        name: "Should maintain original array order",
        status: "passed",
        duration: 6,
      },
      {
        id: "p15",
        name: "Should handle non-numeric values gracefully",
        status: "passed",
        duration: 8,
      },
    ],
  },
  private: {
    name: "Private Tests",
    totalTests: 20,
    passedTests: 20,
    failedTests: 0,
  },
};

export function TestCases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { result, state, loadingMessage, errorMessage } = useTests()

  const testCases = useMemo(() => {
    if (!result) {
      return null
    }
    const grouped = Object.groupBy(result, ({ testCase }) => testCase.suite)
    const publicTests = grouped.public || []
    const privateTests = grouped.private || []
    return {
      public: {
        totalTests: publicTests.length,
        passedTests: publicTests.filter(({ passed }) => passed).length,
        failedTests: publicTests.filter(({ passed }) => !passed).length,
        testCases: publicTests.map(({ testCase, passed, output }) => ({
          name: `${testCase.input.join(', ')} \u2192  ${output.join(', ')}`,
          errorMessage: 'Should be: ' + testCase.expectedOutput.join(', '),
          testCase,
          status: passed ? 'passed' : 'failed',
          duration: 0
        }))
      },
      private: {
        totalTests: privateTests.length,
        passedTests: privateTests.filter(({ passed }) => passed).length,
        failedTests: privateTests.filter(({ passed }) => !passed).length,
        testCases: privateTests.map(({ testCase, passed }) => ({
          name: testCase.input.join(', '),
          errorMessage: 'Should be: ' + testCase.expectedOutput.join(', '),
          testCase,
          status: passed ? 'passed' : 'failed',
          duration: 0
        }))
      },
    }
  }, [result])

  if (state === 'unrun') {
    return (
      <div className="flex items-center justify-center h-full w-full">
        Hit {"'Try it out'"} to view test results.
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-full">
        <div>{loadingMessage}</div>
        <InlineLoadingSpinner />
      </div>
    )
  }

  if (state === 'error') {
    return <div><pre>Error: {errorMessage}</pre></div>
  }

  const allTestsPassed = Object.values(testCases).every(
    (suite) => suite.failedTests === 0
  );

  // Get failed test cases for public tests (limited to 3)
  const publicFailedTests = testCases.public.testCases
    .filter((test) => test.status === "failed")
    .slice(0, 3);

  const handleVisualize = (testId: string) => {
    console.log(`Visualizing test: ${testId}`);
    // Implementation for visualization would go here
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Overview Section */}
      <div className="mb-8 text-center">
        {allTestsPassed ? (
          <div className="flex flex-col items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
            <h1 className="text-2xl font-bold text-green-600">
              All tests passed!
            </h1>
          </div>
        ) : (
          <div className="flex flex-row items-center justify-center gap-4">
            <AlertTriangle className="text-amber-500" strokeWidth={3} />
            <h1 className="text-2xl font-bold text-amber-600">
              Some tests have failed
            </h1>
          </div>
        )}
      </div>

      {/* Test Suites */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Public Tests Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Public Tests</CardTitle>
              <Badge
                variant={
                  testCases.public.failedTests > 0
                    ? "destructive"
                    : "default"
                }
              >
                {testCases.public.passedTests}/
                {testCases.public.totalTests} Passed
              </Badge>
            </div>
            <CardDescription>
              Tests visible to you during development
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testCases.public.failedTests > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-destructive mb-2">
                  Failed Tests ({testCases.public.failedTests})
                </div>
                {publicFailedTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{test.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {test.errorMessage}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-2 flex-shrink-0"
                        onClick={() => handleVisualize(test.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Visualize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-center text-muted-foreground">
                  All public tests are passing!
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Show all test cases
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>All Test Cases</DialogTitle>
                  <DialogDescription>
                    Detailed view of all public test cases
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="failed" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="failed">
                      <XCircle2 className="h-4 w-4 mr-2" />
                      Failed ({testCases.public.failedTests})
                    </TabsTrigger>
                    <TabsTrigger value="passed">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Passed ({testCases.public.passedTests})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="failed" className="space-y-4 mt-4">
                    {testCases.public.testCases
                      .filter((test) => test.status === "failed")
                      .map((test) => (
                        <div
                          key={test.id}
                          className="p-4 bg-red-50 border border-red-200 rounded-md"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">{test.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {test.errorMessage}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Duration: {test.duration}ms
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 flex-shrink-0"
                              onClick={() => handleVisualize(test.id)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Visualize
                            </Button>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  <TabsContent value="passed" className="space-y-4 mt-4">
                    {testCases.public.testCases
                      .filter((test) => test.status === "passed")
                      .map((test) => (
                        <div
                          key={test.id}
                          className="p-4 bg-green-50 border border-green-200 rounded-md"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{test.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Duration: {test.duration}ms
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        {/* Private Tests Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Private Tests</CardTitle>
              <Badge>
                {testCases.private.passedTests}/
                {testCases.private.totalTests} Passed
              </Badge>
            </div>
            <CardDescription>
              Tests used for grading your submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center justify-center">
                {testCases.private.failedTests === 0 ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mb-4" />
                )}
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold">
                    {testCases.private.passedTests}/
                    {testCases.private.totalTests}
                  </p>
                  <p className="text-sm text-muted-foreground">Tests Passing</p>
                </div>
                <Progress
                  value={
                    (testCases.private.passedTests /
                      testCases.private.totalTests) *
                    100
                  }
                  className="w-full h-2"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4">
                Private test details are hidden to prevent hardcoding solutions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
