import { atom } from "jotai";

export const undoStackAtom = atom<string[]>([]);
export const redoStackAtom = atom<string[]>([]);

export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0);
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0);

export function takeSnapshot(canvas: HTMLElement): string {
  return canvas.innerHTML;
}

export function restoreSnapshot(canvas: HTMLElement, snapshot: string): void {
  canvas.innerHTML = snapshot;
}
