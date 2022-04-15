import aligner from "./algorithm.js";
import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
const port = Number(Deno.env.get("START_PORT") ?? 8080);

async function handler(_req: Request): Promise<Response> {
  if (_req.method !== "POST") {
    return new Response("not allowed", { status: 405 });
  }
  try {
    const al = aligner.NWaligner({
      gapSymbol: "⭐️",
    });
    const js: {a:string, b:string, sym?:string} = await _req.json()
    if(js.sym)
    {
      al.gapSymbol = js.sym;
    }
    const res = al.align(js.a, js.b);
    const body = JSON.stringify(res)
    return new Response(body, {
      status: 200,
      headers: new Headers({
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      }),
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}
console.log(`serve on ${port}`);
serve(handler, {
  port,
});
