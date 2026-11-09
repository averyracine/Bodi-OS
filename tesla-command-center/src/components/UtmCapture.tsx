"use client";

import { useEffect } from "react";
import { captureUtmFromLocation } from "@/lib/analytics";

export function UtmCapture() {
  useEffect(() => captureUtmFromLocation(), []);
  return null;
}
