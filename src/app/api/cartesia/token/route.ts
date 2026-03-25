export async function POST() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "DEEPGRAM_API_KEY not configured" },
        { status: 500 }
      );
    }

    // For production: use Deepgram's temporary key API
    // POST https://api.deepgram.com/v1/projects/{project_id}/keys
    // For development: return the API key directly
    // The client uses Sec-WebSocket-Protocol for auth, keeping the key server-side
    const projectId = process.env.DEEPGRAM_PROJECT_ID;

    if (projectId) {
      // Generate a temporary scoped key (30s TTL)
      const res = await fetch(
        `https://api.deepgram.com/v1/projects/${projectId}/keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment: "Temporary browser token",
            scopes: ["usage:write"],
            time_to_live_in_seconds: 30,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        return Response.json({ token: data.key });
      }
    }

    // Fallback: return API key for development
    return Response.json({ token: apiKey });
  } catch (error) {
    console.error("Failed to generate Deepgram token:", error);
    return Response.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}
