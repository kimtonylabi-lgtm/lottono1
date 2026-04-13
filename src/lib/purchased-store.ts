const STORAGE_KEY = "lotto-purchased";
const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

export interface PurchasedSet {
  id: string;
  numbers: number[];
  purchasedAt: string;
  strategy: string;
}

interface StoredData {
  sets: PurchasedSet[];
}

function load(): StoredData {
  if (typeof window === "undefined") return { sets: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sets: [] };
    const data: StoredData = JSON.parse(raw);
    const now = Date.now();
    data.sets = data.sets.filter(
      (s) => now - new Date(s.purchasedAt).getTime() < EXPIRY_MS
    );
    return data;
  } catch {
    return { sets: [] };
  }
}

function save(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPurchasedSets(): PurchasedSet[] {
  return load().sets;
}

export function addPurchasedSet(numbers: number[], strategy: string): PurchasedSet {
  const data = load();
  const set: PurchasedSet = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    numbers: [...numbers].sort((a, b) => a - b),
    purchasedAt: new Date().toISOString(),
    strategy,
  };
  data.sets.push(set);
  save(data);
  return set;
}

export function removePurchasedSet(id: string) {
  const data = load();
  data.sets = data.sets.filter((s) => s.id !== id);
  save(data);
}

export function isPurchased(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b).join(",");
  return load().sets.some(
    (s) => [...s.numbers].sort((a, b) => a - b).join(",") === sorted
  );
}
