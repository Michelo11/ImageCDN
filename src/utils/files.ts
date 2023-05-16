import { readFileSync } from "fs";

export function get(name: string) {
  return readFileSync(name);
}
