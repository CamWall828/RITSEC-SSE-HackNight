export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Run the Workers AI model using the binding defined in wrangler.toml
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello! Tell me a short fact about space." },
      ],
    });

    return Response.json(response);
  },
};
