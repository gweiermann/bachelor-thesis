"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, RotateCw, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimationControlBarProps {
  totalSteps: number
  onPlayPause?: (isPlaying: boolean) => void
  onStepChange?: (step: number) => void
  onSpeedChange?: (speed: number) => void
  className?: string
  currentStepIndex: number
  timePerStep: number
  resetProp: string
}

export default function AnimationControlBar({
  totalSteps,
  currentStepIndex,
  timePerStep,
  onPlayPause,
  onStepChange,
  onSpeedChange,
  resetProp,
  className = "",
}: AnimationControlBarProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const finished = useMemo(
    () => currentStep >= totalSteps - 1,
    [currentStep, totalSteps]
  )
  const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])

  const speedOptions = [0.5, 0.75, 1, 1.5, 2]

  useEffect(() => setCurrentStep(0), [resetProp])

  useEffect(() => {
    onSpeedChange?.(playbackSpeed)
  })

  useEffect(() => {
    onPlayPause?.(isPlaying);
  }, [isPlaying, onPlayPause])

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange])

  useEffect(() => {
    onSpeedChange?.(playbackSpeed);
  }, [playbackSpeed, onSpeedChange])

  const incrementStepByPlayback = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false)
      return
    }
    setCurrentStep((currentStep) => currentStep + 1)
  }, [currentStep, totalSteps])

  useEffect(() => {
    if (isPlaying) {
      let timeout = setTimeout(incrementStepByPlayback, derivedTimePerStep * 1000)
      return () => clearTimeout(timeout)
    }    
  }, [currentStep, isPlaying, derivedTimePerStep, incrementStepByPlayback])

  const handlePlayPauseRestart = useCallback(() => {
    if (finished) {
      setCurrentStep(0)
    } else {
      const newPlayingState = !isPlaying
      setIsPlaying(newPlayingState)
      if (newPlayingState) {
        incrementStepByPlayback()
      }
    }
  }, [finished, isPlaying, incrementStepByPlayback])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setIsPlaying(false)
    }
  }, [currentStep]);

  const handleNextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      setIsPlaying(false)
    }
  }, [currentStep, totalSteps]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  return (
    <div
      className={cn(`flex items-center justify-between p-2 bg-background border rounded-md shadow-sm`, className)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPauseRestart}
        aria-label={isPlaying ? "Pause" : "Play"}          
      >
        {finished ? (
          <RotateCw className="h-5 w-5" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      <div className="flex justify-center grow">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevStep}
            disabled={currentStep <= 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="text-sm font-medium px-2">
            Step {currentStep + 1}/{totalSteps}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextStep}
            disabled={currentStep >= totalSteps - 1}
            aria-label="Next step"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            {playbackSpeed}x
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {speedOptions.map((speed) => (
            <DropdownMenuItem
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={playbackSpeed === speed ? "bg-accent" : ""}
            >
              {speed}x
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
