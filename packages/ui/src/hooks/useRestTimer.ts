import { useState, useEffect, useCallback, useRef } from "react";

export function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback((restSeconds: number) => {
    setSeconds(restSeconds);
    setIsRunning(true);
  }, []);

  const skip = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setSeconds(0);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatted = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return { seconds, isRunning, formatted, start, skip };
}
