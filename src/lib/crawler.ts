import { Draw } from "./types";
import { getDb } from "./firebase";

const COLLECTION = "draws";
const BATCH_SIZE = 500;

export async function loadDraws(): Promise<Draw[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("round", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as Draw);
}

export async function getLastRound(): Promise<number> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("round", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return 0;
  return (snapshot.docs[0].data() as Draw).round;
}

export async function saveDraws(draws: Draw[]): Promise<number> {
  let added = 0;

  const db = getDb();

  // Firestore batch write (max 500 per batch)
  for (let i = 0; i < draws.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = draws.slice(i, i + BATCH_SIZE);

    for (const draw of chunk) {
      const ref = db.collection(COLLECTION).doc(String(draw.round));
      batch.set(ref, draw);
      added++;
    }

    await batch.commit();
  }

  return added;
}
