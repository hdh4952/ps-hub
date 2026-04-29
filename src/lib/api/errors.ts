import { NextResponse } from "next/server";
export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation_failed"
  | "invalid_params"
  | "invalid_body"
  | "handle_not_found"
  | "already_added"
  | "name_exists"
  | "invalid_group_ids"
  | "internal_error";
export type Body = { error: ErrorCode; details?: unknown };
export const json400 = (b: Body) => NextResponse.json(b, { status: 400 });
export const json401 = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
export const json403 = (b: Body = { error: "forbidden" }) => NextResponse.json(b, { status: 403 });
export const json404 = (b: Body = { error: "not_found" }) => NextResponse.json(b, { status: 404 });
export const json409 = (b: Body) => NextResponse.json(b, { status: 409 });
export const json422 = (b: Body) => NextResponse.json(b, { status: 422 });
export const json429 = (b: Body = { error: "rate_limited" }) => NextResponse.json(b, { status: 429 });
export const json500 = (b: Body = { error: "internal_error" }) => NextResponse.json(b, { status: 500 });
