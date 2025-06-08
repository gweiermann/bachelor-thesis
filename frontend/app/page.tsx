"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { Terminal, Zap } from "lucide-react"
import Link from "next/link"
import ClientOnly from '@/lib/client-only'

export default function HeroSection() {
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ClientOnly>
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-100 to-blue-50 py-20 md:py-32 h-full">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-purple-300 blur-[80px]" />
          <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-blue-200 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 blur-[100px]" />
        </div>

        {/* Code-like decorative elements */}
        <div className="absolute inset-0 z-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-xs font-mono text-gray-400"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {`{code: ${Math.floor(Math.random() * 1000)}}`}
            </div>
          ))}
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 flex items-center justify-center gap-2"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-200/60 text-purple-600">
                <Zap size={14} />
              </span>
              <span className="text-sm font-medium text-purple-600">Revolutionizing coding practice</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6 bg-gradient-to-r from-gray-900 via-blue-700 to-purple-700 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl"
            >
              Next gen coding challenges
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mx-auto mb-10 max-w-2xl text-lg text-gray-700 sm:text-xl"
            >
              get visualized feedback and level up your skills
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-blue-400 px-8 text-white hover:from-purple-600 hover:to-blue-500"
              >
                <Link href="/task/bubble-sort">
                  <span className="relative z-10">Try it out</span>
                  <span className="absolute inset-0 -z-0 translate-y-full bg-gradient-to-r from-purple-600 to-blue-500 transition-transform duration-300 group-hover:translate-y-0"></span>
                </Link>
              </Button>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Terminal size={16} />
                <span>No setup required</span>
              </div>
            </motion.div>
          </div>

          {/* Animated code preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mt-16 max-w-3xl"
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white/80 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-1 border-b border-gray-200 px-4 py-2">
                <div className="h-3 w-3 rounded-full bg-red-400"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <div className="ml-2 text-xs font-medium text-gray-500">algorithm-visualizer.js</div>
              </div>
              <div className="p-4 font-mono text-xs text-gray-700 sm:text-sm">
                <CodeAnimation completed={animationComplete} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </ClientOnly>
  )
}

function CodeAnimation({ completed }) {
  "use client"
  const [numbers, setNumbers] = useState([64, 25, 12, 22, 11])
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightIndices, setHighlightIndices] = useState([])

  // Sorting steps for visualization (selection sort)
  const [sortingSteps, ] = useState([
    { array: [64, 25, 12, 22, 11], highlight: [0, 1], message: "Comparing 64 and 25" },
    { array: [64, 25, 12, 22, 11], highlight: [1, 2], message: "Comparing 25 and 12" },
    { array: [64, 25, 12, 22, 11], highlight: [2, 3], message: "Comparing 12 and 22" },
    { array: [64, 25, 12, 22, 11], highlight: [2, 4], message: "Comparing 12 and 11" },
    { array: [64, 25, 12, 22, 11], highlight: [4], message: "Found minimum: 11" },
    { array: [11, 25, 12, 22, 64], highlight: [0, 4], message: "Swap 64 and 11" },
    { array: [11, 25, 12, 22, 64], highlight: [1, 2], message: "Comparing 25 and 12" },
    { array: [11, 25, 12, 22, 64], highlight: [2, 3], message: "Comparing 12 and 22" },
    { array: [11, 25, 12, 22, 64], highlight: [2], message: "Found minimum: 12" },
    { array: [11, 12, 25, 22, 64], highlight: [1, 2], message: "Swap 25 and 12" },
    { array: [11, 12, 25, 22, 64], highlight: [2, 3], message: "Comparing 25 and 22" },
    { array: [11, 12, 25, 22, 64], highlight: [3], message: "Found minimum: 22" },
    { array: [11, 12, 22, 25, 64], highlight: [2, 3], message: "Swap 25 and 22" },
    { array: [11, 12, 22, 25, 64], highlight: [0, 1, 2, 3, 4], message: "Array sorted!" },
  ])

  useEffect(() => {
    if (!completed) return

    let step = 0
    const interval = setInterval(() => {
      if (step < sortingSteps.length) {
        setNumbers(sortingSteps[step].array)
        setHighlightIndices(sortingSteps[step].highlight)
        setCurrentStep(step)
        step++
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [completed, sortingSteps])

  const getBarHeight = (value) => {
    const max = Math.max(...numbers)
    return (value / max) * 100
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex h-40 items-end justify-around">
        {numbers.map((number, index) => (
          <motion.div
            key={index}
            className={`w-12 rounded-t-md text-center font-mono font-bold ${
              highlightIndices.includes(index) ? "bg-green-400 text-white" : "bg-blue-300/80 text-gray-800"
            }`}
            style={{
              height: `${getBarHeight(number)}%`,
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              height: `${getBarHeight(number)}%`,
            }}
            transition={{
              duration: 0.5,
              height: { type: "spring", stiffness: 100 },
            }}
          >
            <div className="mt-2">{number}</div>
          </motion.div>
        ))}
      </div>

      {completed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-md bg-gray-100 p-3 text-center text-sm"
        >
          <span className="text-blue-600">
            {currentStep < sortingSteps.length ? sortingSteps[currentStep].message : "Sorting complete!"}
          </span>
        </motion.div>
      )}
    </div>
  )
}
