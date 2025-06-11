const releaseId = process.env.RELEASE_ID;
const external_id = process.env.EXTERNAL_ID;
const API_KEY = process.env.RELEASENOTES_API_KEY;
const PROJECT_ID = process.env.PROJECT_ID || "9630";
const TITLE = process.env.PR_TITLE || "Untitled PR";
const SUMMARY = process.env.PR_SUMMARY || "No summary provided.";

if (!API_KEY) {
  console.error("❌ RELEASENOTES_API_KEY is not set.");
  process.exit(1);
}

if (!releaseId) {
  console.error("❌ RELEASE_ID is not set.");
  process.exit(1);
}

if (!external_id) {
  console.error("❌ EXTERNAL_ID is not set.");
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error("❌ PROJECT_ID is not set.");
  process.exit(1);
}

// Helper function to make API requests
async function makeApiRequest(url, method = "GET", data = null) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Add API token as a query parameter
  const urlWithToken = new URL(url);
  urlWithToken.searchParams.append("api_token", API_KEY);

  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  console.log(`\n🌐 Making ${method} request to: ${urlWithToken.toString()}`);
  if (data) {
    console.log("📤 Payload:", JSON.stringify(data, null, 2));
  }

  const response = await fetch(urlWithToken.toString(), options);
  const responseText = await response.text();

  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    console.warn("⚠️ Could not parse response as JSON, showing raw response:");
    console.log(responseText);
    throw new Error("Invalid JSON response from server");
  }

  if (!response.ok) {
    console.error(`❌ Error from ReleaseNotes.io (${response.status}):`);
    console.error(JSON.stringify(responseData, null, 2));

    if (response.status === 302) {
      console.error(
        "\n🔴 Authentication failed (302 Redirect). Please check your API key and project ID."
      );
    } else if (response.status === 401) {
      console.error("\n🔴 Unauthorized (401). Please check your API key.");
    } else if (response.status === 404) {
      console.error(
        "\n🔴 Project not found (404). Please check your project ID."
      );
    }

    throw new Error(`API request failed with status ${response.status}`);
  }

  return responseData;
}

(async () => {
  try {
    console.log("🚀 Preparing to push to ReleaseNotes.io...");
    console.log(`📝 Title: ${TITLE}`);
    console.log(`📋 Summary: ${SUMMARY}`);

    const payload = {
      id: releaseId,
      title: TITLE,
      description: SUMMARY,
      external_id: external_id,
      notes: [
        {
          note_type: "feature",
          note_title: "sample feature",
        },
        {
          note_type: "bugfix",
          note_title: "sample bugfix",
        },
        {
          note_type: "update",
          note_title: "sample update",
        },
      ],
      //type: "new",
    };

    //get the release details
    // const releaseDetails = await makeApiRequest(
    //   `https://api.releasenotes.io/api/v1/projects/${PROJECT_ID}/releases/AKMz9`,
    //   "GET"
    // );

    // console.log("\n✅ Successfully fetched release details!");
    // console.log(JSON.stringify(releaseDetails, null, 2));

    // return;

    // Now create the release with the note
    console.log("\n📤 Creating release with note...");
    const result = await makeApiRequest(
      `https://api.releasenotes.io/api/v1/projects/${PROJECT_ID}/releases`,
      "POST",
      payload
    );

    console.log("\n✅ Successfully pushed to ReleaseNotes.io!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
})();
