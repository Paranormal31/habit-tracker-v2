import { z } from "zod";

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  return schema.parse(data);
}
