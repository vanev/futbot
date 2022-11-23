import dotenv from "dotenv";

dotenv.config();

export const get = (key: string): string | undefined => process.env[key];

export class MissingRequired extends Error {
  constructor(key: string) {
    super(`Missing required environment variable: ${key}`);
  }
}

export const getRequired = (key: string): string => {
  const value = get(key);
  if (!value) throw new MissingRequired(key);
  return value;
};
