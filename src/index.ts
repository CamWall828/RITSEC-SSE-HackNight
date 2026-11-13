export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests from browsers
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Send a POST request with a JSON body: { \"prompt\": \"...\" }", { status: 405 });
    }

    try {
      const { prompt } = await request.json<{ prompt?: string }>();
      if (!prompt) {
        return Response.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
      }

      const aiResponse = await env.AI.run("@cf/cloudflare/clef-omni", {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
      });

      return Response.json(aiResponse, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch (error) {
      return Response.json(
        { error: error?.message || "Unknown error occurred" },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
  },
};
