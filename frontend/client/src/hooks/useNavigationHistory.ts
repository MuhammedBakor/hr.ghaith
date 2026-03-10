import { useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useLocation } from 'wouter';

export interface NavHistoryEntry {
  path: string;
  label: string;
  /** synthetic key to allow same path with different labels (section vs page) */
  key: string;
}

const MAX_HISTORY = 10;

// Global store so history survives component remounts
let globalHistory: NavHistoryEntry[] = [];
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function getSnapshot() {
  return globalHistory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function findLabel(pathToLabelMap: Record<string, string>, location: string): string {
  if (pathToLabelMap[location]) return pathToLabelMap[location];

  const sortedPaths = Object.keys(pathToLabelMap).sort((a, b) => b.length - a.length);
  for (const path of sortedPaths) {
    if (path !== '/' && location.startsWith(path)) {
      return pathToLabelMap[path];
    }
  }
  return 'الرئيسية';
}

export interface SectionInfo {
  label: string;
  path: string;
}

export function useNavigationHistory(
  pathToLabelMap: Record<string, string>,
  sectionMap: Record<string, SectionInfo>
) {
  const [location, setLocation] = useLocation();

  const calculateHierarchy = useCallback(() => {
    const entries: NavHistoryEntry[] = [];
    let currentPath = location;

    // Guard for circular dependencies
    const visited = new Set<string>();

    while (currentPath && !visited.has(currentPath)) {
      visited.add(currentPath);

      const label = pathToLabelMap[currentPath] || (currentPath === '/' ? 'الرئيسية' : '');
      if (label) {
        entries.unshift({
          path: currentPath,
          label,
          key: `page:${currentPath}`
        });
      }

      const parent = sectionMap[currentPath];
      if (parent && parent.path !== currentPath) {
        currentPath = parent.path;
      } else if (currentPath !== '/') {
        currentPath = '/';
      } else {
        break;
      }
    }

    return entries;
  }, [location, pathToLabelMap, sectionMap]);

  const history = calculateHierarchy();

  const navigateTo = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  return { history, navigateTo };
}
