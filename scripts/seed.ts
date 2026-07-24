import { POSITIONS, SLOTS } from "@/lib/domain";
import { getDb, Timestamp } from "@/lib/firebase-admin";

async function main() {
  const db = getDb();
  const batch = db.batch();

  for (const position of POSITIONS) {
    batch.set(db.collection("positions").doc(String(position.id)), position, { merge: true });
  }

  for (const slot of SLOTS) {
    batch.set(db.collection("slots").doc(slot.id), slot, { merge: true });
  }

  batch.set(
    db.collection("settings").doc("plan"),
    {
      imageUrl: null,
      note: "Cargar el enlace publico del plano del salon principal cuando este disponible.",
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );

  await batch.commit();
  console.log(`Seed listo: ${POSITIONS.length} posiciones y ${SLOTS.length} horarios.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
