// Configuration
const config = {
  apiKey: process.env.RELEASENOTES_API_KEY,
  projectId: process.env.PROJECT_ID || "9630",
  version: process.env.VERSION || "1.0.0",
  title: process.env.RELEASE_TITLE || "New Release",
  body: process.env.RELEASE_BODY || "",
  isDraft: (process.env.IS_DRAFT || "true").toLowerCase() === "true",
  externalId: process.env.EXTERNAL_ID || `release-${Date.now()}`,
};

// Validate required configuration
function validateConfig() {
  const required = [
    { key: 'apiKey', name: 'RELEASENOTES_API_KEY' },
    { key: 'projectId', name: 'PROJECT_ID' },
    { key: 'version', name: 'VERSION' },
  ];

  const missing = required.filter(({ key, name }) => {
    if (!config[key]) {
      console.error(`❌ ${name} is not set.`);
      return true;
    }
    return false;
  });

  if (missing.length > 0) {
    process.exit(1);
  }
}

// Helper function to make API requests
async function makeApiRequest(endpoint, method = "GET", data = null) {
  try {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Construct full URL with API token
    const url = new URL(`/api/v1/projects/${config.projectId}${endpoint}`, 'https://api.releasenotes.io');
    url.searchParams.append('api_token', config.apiKey);

    const options = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    console.log(`\n🌐 Making ${method} request to: ${url.toString()}`);
    if (data) {
      console.log('📤 Payload:', JSON.stringify(data, null, 2));
    }

    const response = await fetch(url.toString(), options);
    const responseText = await response.text();

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('⚠️ Could not parse response as JSON, showing raw response:');
      console.error(responseText);
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
      } else if (response.status >= 500) {
        console.error('\n🔴 Server error. Please try again later or contact support.');
      }

      throw new Error(`API request failed with status ${response.status}`);
    }

    return responseData;
  } catch (error) {
    if (error.name === 'FetchError') {
      console.error('\n🔴 Network error:', error.message);
      throw new Error('Failed to connect to ReleaseNotes.io. Please check your network connection.');
    }
    throw error;
  }
}

// Create a new release
async function createRelease() {
  console.log('🚀 Creating new release...');
  
  const releaseData = {
    version: config.version,
    title: config.title,
    body: config.body,
    is_draft: config.isDraft,
    external_id: config.externalId,
  };

  try {
    const result = await makeApiRequest('/releases', 'POST', releaseData);
    console.log('\n✅ Success! Release created in ReleaseNotes.io');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('\n❌ Failed to create release:', error.message);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Validate configuration first
    validateConfig();
    
    console.log('📋 Release Configuration:');
    console.log(`- Project ID: ${config.projectId}`);
    console.log(`- Version: ${config.version}`);
    console.log(`- Title: ${config.title}`);
    console.log(`- Is Draft: ${config.isDraft}`);
    console.log(`- External ID: ${config.externalId}`);
    
    // Create the release
    const release = await createRelease();
    
    // Output the release information in JSON format for the workflow
    console.log('\n--- RELEASE_INFO_START ---');
    console.log(JSON.stringify({
      release_id: release.id,
      external_id: config.externalId,
      version: config.version
    }));
    console.log('--- RELEASE_INFO_END ---');
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
})();
