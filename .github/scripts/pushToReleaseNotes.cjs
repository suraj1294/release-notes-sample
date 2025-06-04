// pushToReleaseNotes.js

const https = require("https");

const API_KEY = process.env.RELEASENOTES_API_KEY;
const ENDPOINT = "https://api.releasenotes.io/v1/releases/draft/entries";

// Example input values
const prTitle = process.env.PR_TITLE || "Default PR Title";
const prSummary =
  process.env.PR_SUMMARY || "This is a summary of the PR changes.";

const data = JSON.stringify({
  title: prTitle,
  body: prSummary,
});

const options = {
  method: "POST",
  hostname: "api.releasenotes.io",
  path: "/v1/releases/draft/entries",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log("✅ ReleaseNotes.io response:", res.statusCode, responseData);
    if (res.statusCode >= 300) {
      console.error("❌ Failed to push PR to ReleaseNotes.io.");
      process.exit(1);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error pushing to ReleaseNotes.io:", error);
  process.exit(1);
});

req.write(data);
req.end();
