"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, RotateCw, Pause, Play } from "lucide-react";

export default function AnimationControlBar({
  defaultStartIndex,
  totalSteps,
  timePerStep,
  onPlayPause,
  onStepChange,
  onSpeedChange,
  className = "",
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const finished = useMemo(
    () => currentStep >= totalSteps - 1,
    [currentStep, totalSteps]
  )
  const derivedTimePerStep = useMemo(() => timePerStep / playbackSpeed, [timePerStep, playbackSpeed])

  const speedOptions = [0.5, 0.75, 1, 1.5, 2]

  useEffect(() => setCurrentStep(0), [])

  useEffect(() => {
    onSpeedChange?.(playbackSpeed)
  }, [])

  useEffect(() => {
    onPlayPause?.(isPlaying);
  }, [isPlaying])

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep])

  useEffect(() => {
    onSpeedChange?.(playbackSpeed);
  }, [playbackSpeed])

  const incrementStepByPlayback = () => {
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false)
      return
    }
    setCurrentStep((currentStep) => currentStep + 1)
  }

  useEffect(() => {
    if (isPlaying) {
      let timeout = setTimeout(incrementStepByPlayback, derivedTimePerStep * 1000)
      return () => clearTimeout(timeout)
    }    
  }, [currentStep, isPlaying])

  const handlePlayPauseRestart = () => {
    if (finished) {
      setCurrentStep(0)
      setIsPlaying(false)
    } else {
      const newPlayingState = !isPlaying
      setIsPlaying(newPlayingState)
      if (newPlayingState) {
        incrementStepByPlayback()
      }
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setIsPlaying(false)
      const newStep = currentStep - 1
      setCurrentStep(newStep)
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setIsPlaying(false)
      const newStep = currentStep + 1
      setCurrentStep(newStep)
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
  }

  return (
    <div
      className={`flex items-center justify-between p-2 bg-background border rounded-md shadow-sm ${className}`}
    >
      <div className="flex items-center space-x-2">
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
