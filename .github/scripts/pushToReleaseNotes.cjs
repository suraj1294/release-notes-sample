// pushToReleaseNotes.cjs

const API_KEY = process.env.RELEASENOTES_API_KEY;
const TITLE = process.env.PR_TITLE || "Untitled PR";
const SUMMARY = process.env.PR_SUMMARY || "No summary provided.";
const PROJECT_ID = process.env.PROJECT_ID || "9630";

// Function to create a URL-friendly slug from text with max length
function createSlug(text, maxLength = 20) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .substring(0, maxLength); // Limit length to maxLength chars
}

if (!API_KEY) {
  console.error("❌ RELEASENOTES_API_KEY is not set.");
  process.exit(1);
}

// Create a note object with the PR details
const note = {
  title: TITLE,
  body: SUMMARY,
  type: 'new'
};

// Create the release payload
const releaseTitle = `Draft Release ${new Date().toISOString().split('T')[0]}`;
const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
const payload = {
  title: releaseTitle,
  external_id: `rel-${createSlug(TITLE, 10)}-${timestamp}`,
  description: `Draft release created from PR: ${TITLE}`,
  type: 'update',
  status: 'pending',
  private: false,
  notes: [note]
};

console.log('Generated external_id:', payload.external_id); // Log the generated external_id

// Helper function to make API requests
async function makeApiRequest(url, method = 'GET', data = null) {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Add API token as a query parameter
  const urlWithToken = new URL(url);
  urlWithToken.searchParams.append('api_token', API_KEY);

  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };

  console.log(`\n🌐 Making ${method} request to: ${urlWithToken.toString()}`);
  if (data) {
    console.log('📤 Payload:', JSON.stringify(data, null, 2));
  }

  const response = await fetch(urlWithToken.toString(), options);
  const responseText = await response.text();
  
  let responseData;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (e) {
    console.warn('⚠️ Could not parse response as JSON, showing raw response:');
    console.log(responseText);
    throw new Error('Invalid JSON response from server');
  }

  if (!response.ok) {
    console.error(`❌ Error from ReleaseNotes.io (${response.status}):`);
    console.error(JSON.stringify(responseData, null, 2));
    
    if (response.status === 302) {
      console.error('\n🔴 Authentication failed (302 Redirect). Please check your API key and project ID.');
    } else if (response.status === 401) {
      console.error('\n🔴 Unauthorized (401). Please check your API key.');
    } else if (response.status === 404) {
      console.error('\n🔴 Project not found (404). Please check your project ID.');
    }
    
    throw new Error(`API request failed with status ${response.status}`);
  }

  return responseData;
}

(async () => {
  try {
    console.log('🚀 Preparing to push to ReleaseNotes.io...');
    console.log(`📝 Title: ${TITLE}`);
    console.log(`📋 Summary: ${SUMMARY}`);
    
    // First, get the list of projects to verify the API key
    console.log('\n🔍 Verifying API key by fetching projects...');
    const projects = await makeApiRequest('https://api.releasenotes.io/api/v1/projects');
    console.log('✅ Successfully connected to ReleaseNotes.io');
    console.log('📋 Available projects:', JSON.stringify(projects, null, 2));
    
    // Now create the release with the note
    console.log('\n📤 Creating release with note...');
    const result = await makeApiRequest(
      `https://api.releasenotes.io/api/v1/projects/${PROJECT_ID}/releases`,
      'POST',
      payload
    );
    
    console.log('\n✅ Successfully pushed to ReleaseNotes.io!');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
