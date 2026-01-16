// app/(app)/calendar/edit/[id]/page.tsx
import { ModalShell } from "@/components/calendar/modals/ModalShell";
import { EditEventForm } from "@/components/calendar/forms/EditEventForm";

export default async function EditEventModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ModalShell title="Edit Event">
      <EditEventForm id={id} />
    </ModalShell>
  );
}
