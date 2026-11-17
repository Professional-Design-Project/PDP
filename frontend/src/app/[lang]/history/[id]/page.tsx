import { HistoryEntry } from "@/components/history/history-entry";

export default async function HistoryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HistoryEntry id={id} />;
}
