export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Send a POST request with a .txt file or JSON body.", { status: 405 });
    }

    try {
      const contentType = request.headers.get("Content-Type") || "";
      let fileContent = "";

      // Handle multipart/form-data (e.g., curl -F "file=@logs.txt")
      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") {
          return Response.json({ error: "Missing 'file' upload in form data" }, { status: 400 });
        }
        fileContent = await file.text();
      } 
      // Handle JSON payload ({ "prompt": "..." })
      else if (contentType.includes("application/json")) {
        const body = await request.json<{ prompt?: string }>();
        fileContent = body.prompt || "";
      } 
      // Handle raw text file upload (e.g., curl --data-binary @logs.txt)
      else {
        fileContent = await request.text();
      }

      if (!fileContent.trim()) {
        return Response.json({ error: "Uploaded file or text is empty" }, { status: 400 });
      }

      // Run Gemma 4 26B A4B for direct text analysis
      const aiResponse = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
        messages: [
          {
            role: "system",
            content:
              "You are a cybersecurity analyst. Analyze the provided log file and give a direct, clear response detailing any security events, suspicious activity, severity level, and recommended next steps.",
          },
          {
            role: "user",
            content: fileContent,
          },
        ],
        // Disable step-by-step reasoning tokens for faster, direct answers
        chat_template_kwargs: {
          enable_thinking: false,
        },
      });

      return Response.json(
        {
          characters_processed: fileContent.length,
          aiResponse,
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    } catch (error: any) {
      return Response.json(
        { error: error?.message || "Failed to process file" },
        { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
  },
};
