import { NextResponse } from "next/server";
type Body = { error: string; details?: unknown };
export const json400 = (b: Body) => NextResponse.json(b, { status: 400 });
export const json401 = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
export const json404 = (b: Body = { error: "not_found" }) => NextResponse.json(b, { status: 404 });
export const json409 = (b: Body) => NextResponse.json(b, { status: 409 });
export const json422 = (b: Body) => NextResponse.json(b, { status: 422 });
export const json500 = (b: Body = { error: "internal_error" }) => NextResponse.json(b, { status: 500 });
