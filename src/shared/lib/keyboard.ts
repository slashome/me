const MENU = '[data-menu] a';

function items(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>(MENU));
}

function move(step: number): void {
  const links = items();
  if (!links.length) return;
  const current = links.indexOf(document.activeElement as HTMLAnchorElement);
  const next =
    current < 0 ? (step > 0 ? 0 : links.length - 1) : (current + step + links.length) % links.length;
  links[next]?.focus();
}

function activate(): void {
  const focused = document.activeElement;
  if (focused instanceof HTMLAnchorElement && focused.matches(MENU)) focused.click();
}

function goUp(): void {
  const up = document.body.dataset.up;
  if (up) window.location.href = up;
}

const ACTIONS: Record<string, () => void> = {
  ArrowDown: () => move(1),
  ArrowUp: () => move(-1),
  ArrowRight: activate,
  ArrowLeft: goUp,
  KeyS: () => move(1),
  KeyW: () => move(-1),
  KeyD: activate,
  KeyA: goUp,
};

export function bindKeyboard(): void {
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable || target?.closest('input, textarea, select')) return;

    const action = ACTIONS[event.code] ?? ACTIONS[event.key];
    if (!action) return;

    event.preventDefault();
    action();
  });
}

export async function layoutHint(): Promise<string> {
  const fallback = 'WASD';
  const keyboard = (navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } })
    .keyboard;
  if (!keyboard?.getLayoutMap) return fallback;

  try {
    const map = await keyboard.getLayoutMap();
    const letters = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].map((code) => map.get(code)?.toUpperCase());
    return letters.every(Boolean) ? letters.join('') : fallback;
  } catch {
    return fallback;
  }
}
