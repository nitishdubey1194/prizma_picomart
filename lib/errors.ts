export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export function toErrorResponse(err: unknown): { status: number; message: string } {
  if (err instanceof AppError) {
    return { status: err.status, message: err.message };
  }
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "42501") {
      return { status: 403, message: "You don't have permission to do this." };
    }
    if (code === "23505") {
      return { status: 409, message: "A record with this value already exists." };
    }
    if (code === "23P01") {
      return { status: 409, message: "This overlaps with an existing availability block." };
    }
  }
  if (err instanceof Error) {
    if (err.message === "Unauthorized") return { status: 401, message: err.message };
    if (err.message === "Appointment not found.") return { status: 404, message: err.message };
    if (err.message === "Order not found.") return { status: 404, message: err.message };
    return { status: 400, message: err.message }; 
  }
  return { status: 400, message: "Invalid request." };
}