/**
 * Issues a single-use token for ElevenLabs Scribe v2 Realtime WebSocket auth.
 * Token is safe to expose to the browser (expires after 15 minutes).
 */
export async function POST() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs token error:", err);
      return Response.json(
        { error: "Failed to generate ElevenLabs token" },
        { status: 500 }
      );
    }

    const data = await res.json();
    return Response.json({ token: data.token });
  } catch (error) {
    console.error("ElevenLabs token error:", error);
    return Response.json(
      { error: "Failed to generate access token" },
      { status: 500 }
    );
  }
}
