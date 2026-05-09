import { Prisma } from "@/app/generated/prisma/client";

export function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}
