// pushToReleaseNotes.js

const API_KEY = process.env.RELEASENOTES_API_KEY;
const TITLE = process.env.PR_TITLE || "Untitled PR";
const SUMMARY = process.env.PR_SUMMARY || "No summary provided.";

if (!API_KEY) {
  console.error("❌ RELEASENOTES_API_KEY is not set.");
  process.exit(1);
}

const PROJECT_ID = process.env.PROJECT_ID || "9630";
const LIMIT = process.env.LIMIT || "20";

const payload = {
  title: TITLE,
  description: SUMMARY,
};

(async () => {
  try {
    console.log(`Pushing to ReleaseNotes.io: ${JSON.stringify(payload)}`);
    const res = await fetch(
      `https://api.releasenotes.io/v1/projects/${PROJECT_ID}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseBody = await res.text();

    if (!res.ok) {
      console.error(
        `❌ Error from ReleaseNotes.io (${res.status}):\n${responseBody}`
      );
      process.exit(1);
    }

    console.log(`✅ Successfully pushed to ReleaseNotes.io:\n${responseBody}`);
  } catch (error) {
    console.error("❌ Network or execution error:", error);
    process.exit(1);
  }
})();
