import { ModalShell } from "@/components/calendar/modals/ModalShell";
import { CreateEventForm } from "@/components/calendar/forms/CreateEventForm";

export default function NewEventModal() {
  return (
    <ModalShell title="Create Event">
      <CreateEventForm />
    </ModalShell>
  );
}