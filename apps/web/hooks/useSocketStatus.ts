"use client";

import { useState, useEffect } from "react";
import { socketManager, type SocketStatus } from "../lib/socket";

export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(
    socketManager.getStatus(),
  );

  useEffect(() => {
    return socketManager.onStatusChange(setStatus);
  }, []);

  return status;
}
