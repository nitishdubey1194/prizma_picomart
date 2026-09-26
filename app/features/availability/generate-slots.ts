import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const STORE_TIMEZONE = "Asia/Kolkata";

export type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

interface WeeklyHoursBlock {
  weekday: number;
  startTime: string;
  endTime: string;
}

interface ExceptionDay {
  exceptionDate: string;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

interface ExistingAppointment {
  startTime: string;
  endTime: string;
}

interface GenerateSlotsParams {
  date: string;
  weeklyHours: WeeklyHoursBlock[];
  exceptions: ExceptionDay[];
  existingAppointments: ExistingAppointment[];
  durationMinutes: number;
  now?: Date;
}

export function generateSlots({
  date,
  weeklyHours,
  exceptions,
  existingAppointments,
  durationMinutes,
  now = new Date(),
}: GenerateSlotsParams): TimeSlot[] {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const exception = exceptions.find((e) => e.exceptionDate === date);

  if (exception && !exception.isAvailable) return [];

  const blocks: { startTime: string; endTime: string }[] =
    exception?.isAvailable && exception.startTime && exception.endTime
      ? [{ startTime: exception.startTime, endTime: exception.endTime }]
      : weeklyHours.filter((h) => h.weekday === weekday);

  if (blocks.length === 0) return [];

  const sortedAppointments = [...existingAppointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const slots: TimeSlot[] = [];

  for (const block of blocks) {
    const blockStart = fromZonedTime(`${date}T${block.startTime}`, STORE_TIMEZONE);
    const blockEnd = fromZonedTime(`${date}T${block.endTime}`, STORE_TIMEZONE);

    let cursor = blockStart;

    while (addMinutes(cursor, durationMinutes) <= blockEnd) {
      const candidateEnd = addMinutes(cursor, durationMinutes);

      const conflict = sortedAppointments.find(
        (a) => cursor < new Date(a.endTime) && candidateEnd > new Date(a.startTime)
      );

      if (conflict) {
        cursor = new Date(conflict.endTime);
        continue;
      }

      const isPast = cursor < now;

      slots.push({
        start: cursor.toISOString(),
        end: candidateEnd.toISOString(),
        available: !isPast,
      });

      cursor = candidateEnd;
    }
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}