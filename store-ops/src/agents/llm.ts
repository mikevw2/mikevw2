/**
 * The only file that talks to the Claude API. Two entry points:
 *   draftStructured()  -> long-form drafting on the drafting model, server-side fallbacks on
 *   cheapStructured()  -> short classification / variants on the cheap model (no fallbacks: unsupported there)
 * Both return zod-validated objects through output_config.format.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod/v4";
import { MODELS, loadEnv, requireEnv } from "../config.js";

let client: Anthropic | undefined;

export function getClient(): Anthropic {
  if (!client) {
    requireEnv("ANTHROPIC_API_KEY", loadEnv());
    client = new Anthropic();
  }
  return client;
}

/** Allows tests and dry runs to swap the client. */
export function setClient(c: Anthropic | undefined): void {
  client = c;
}

export interface StructuredCallResult<T> {
  output: T;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export class RefusedError extends Error {
  constructor(public readonly category: string | null | undefined, explanation?: string | null) {
    super(`model refused (${category ?? "unknown"}): ${explanation ?? ""}`);
    this.name = "RefusedError";
  }
}

/**
 * Long-form drafting. Thinking is adaptive and on by default on this model; depth comes from effort.
 */
export async function draftStructured<S extends z.ZodType>(args: {
  schema: S;
  system: string;
  user: string;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<StructuredCallResult<z.infer<S>>> {
  const c = getClient();
  const response = await c.beta.messages.parse({
    model: MODELS.DRAFT,
    max_tokens: args.maxTokens ?? 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: args.user }],
    output_config: { effort: args.effort ?? "medium", format: betaZodOutputFormat(args.schema) },
  });
  if (response.stop_reason === "refusal") {
    throw new RefusedError(response.stop_details?.category, response.stop_details?.explanation);
  }
  if (!response.parsed_output) throw new Error(`no parsed output (stop_reason=${response.stop_reason})`);
  return {
    output: response.parsed_output as z.infer<S>,
    model: response.model,
    usage: { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens },
  };
}

/** Cheap, short, structured. */
export async function cheapStructured<S extends z.ZodType>(args: {
  schema: S;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<StructuredCallResult<z.infer<S>>> {
  const c = getClient();
  const response = await c.messages.parse({
    model: MODELS.CHEAP,
    max_tokens: args.maxTokens ?? 2000,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    output_config: { format: zodOutputFormat(args.schema) },
  });
  if (response.stop_reason === "refusal") {
    throw new RefusedError(response.stop_details?.category, response.stop_details?.explanation);
  }
  if (!response.parsed_output) throw new Error(`no parsed output (stop_reason=${response.stop_reason})`);
  return {
    output: response.parsed_output as z.infer<S>,
    model: response.model,
    usage: { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens },
  };
}

/** Plain short text on the drafting model (weekly narrative). */
export async function draftText(args: { system: string; user: string; maxTokens?: number }): Promise<string> {
  const c = getClient();
  const response = await c.beta.messages.create({
    model: MODELS.DRAFT,
    max_tokens: args.maxTokens ?? 1000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    output_config: { effort: "low" },
  });
  if (response.stop_reason === "refusal") {
    throw new RefusedError(response.stop_details?.category, response.stop_details?.explanation);
  }
  return response.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
