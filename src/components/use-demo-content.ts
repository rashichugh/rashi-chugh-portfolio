"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin-provider";
import { onStudioUpdate, readDemoProjects, readDemoSite } from "@/lib/demo-store";
import type { Project, SiteContent } from "@/types/content";

export function useDemoSite(initial: SiteContent) {
  const { isDemo } = useAdmin();
  const [site, setSite] = useState(initial);
  const [persistedSite, setPersistedSite] = useState(initial);
  useEffect(() => {
    if (!isDemo) return;
    const update = () => {
      const next = readDemoSite(initial);
      setSite(next);
      setPersistedSite(next);
    };
    update();
    return onStudioUpdate(update);
  }, [initial, isDemo]);
  return [site, setSite, persistedSite] as const;
}

export function useDemoProjects(initial: Project[]) {
  const { isDemo } = useAdmin();
  const [projects, setProjects] = useState(initial);
  useEffect(() => {
    if (!isDemo) return;
    const update = () => setProjects(readDemoProjects(initial));
    update();
    return onStudioUpdate(update);
  }, [initial, isDemo]);
  return [projects, setProjects] as const;
}
