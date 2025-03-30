import axios from 'axios';

// Individual API keys for each type of API call
const API_KEYS = {
  requirements: '#1',
  application: '#2',
  testCases: '#3',
  testScenarios: '#4',
  testCode: '#5',
  testReport: '#6'
};

// Gemini API URL
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

// Function to truncate and simplify the Figma blueprint to reduce size
const prepareFigmaBlueprint = (figmaBlueprint) => {
  // Check if we have a document to work with
  if (!figmaBlueprint || !figmaBlueprint.document) {
    return "No blueprint data available";
  }

  // Create a simplified version with just essential properties
  const simplifyNode = (node, depth = 0, maxDepth = 4) => {
    // Stop recursion at max depth
    if (depth >= maxDepth) return { name: node.name, type: node.type };

    const simplified = {
      name: node.name,
      type: node.type,
    };

    // Include some key properties if they exist
    if (node.absoluteBoundingBox) {
      simplified.dimensions = {
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }

    // For text nodes, include the text content
    if (node.type === 'TEXT' && node.characters) {
      simplified.text = node.characters;
    }

    // Recursively process children, but only if we haven't hit max depth
    if (node.children && node.children.length > 0 && depth < maxDepth) {
      simplified.children = node.children
        .slice(0, 20) // Limit to 20 children per node to control size
        .map(child => simplifyNode(child, depth + 1, maxDepth));
    }

    return simplified;
  };

  // Start with the document and limit depth
  const simplifiedBlueprint = simplifyNode(figmaBlueprint.document, 0, 3);
  
  return JSON.stringify(simplifiedBlueprint, null, 2);
};

const ApiService = {
  // Call Gemini API with proper headers and formatting - using the specified API key
  callGeminiApi: async (prompt, temperature = 0.7, maxOutputTokens = 1024, apiKeyType = 'requirements') => {
    try {
      // Use the specified API key for this type of call
      const apiKey = API_KEYS[apiKeyType];
      console.log(`Calling Gemini API for ${apiKeyType} with prompt length: ${prompt.length} chars`);
      
      // Request payload format for Gemini API
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        }
      );

      console.log('Gemini API response received');
      
      // Extract and return the generated text
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts[0]) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected response structure:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
        throw new Error('Unexpected response structure from Gemini API');
      }
    } catch (error) {
      // Handle specific API errors
      if (error.response && error.response.status === 429) {
        throw new Error(`Rate limit reached for ${apiKeyType} API key. Please try again later.`);
      }
      
      console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
      throw new Error(`Failed to call Gemini API: ${error.message}`);
    }
  },

  // Generate functional requirements from Figma blueprint
  generateRequirements: async (figmaBlueprint) => {
    // Prepare a simplified version of the blueprint
    const simplifiedBlueprint = prepareFigmaBlueprint(figmaBlueprint);
    
    // Enhanced prompt with more detailed instructions and examples
    const prompt = `
      You are an expert product manager and software architect. Your task is to analyze a Figma design blueprint and generate detailed functional requirements for a web application based on this design.

      IMPORTANT: Even if the design is simple or appears to be a learning exercise, imagine and extrapolate what a real functional application based on this design would need as requirements.
      
      Focus on:
      1. Core functionality the app should provide based on the design elements
      2. User interactions and flows (clicks, form submissions, navigation)
      3. Data management requirements (saving, loading, validating input)
      4. Integration points with backend systems
      5. Authentication and authorization needs
      
      FORMAT YOUR RESPONSE AS A NUMBERED LIST OF REQUIREMENTS. Each requirement should be prefixed with "REQ-" and a number, followed by a clear description.
      
      Here are examples of good requirements:
      REQ-1: The system shall allow users to log in using their email and password.
      REQ-2: The system shall display a dashboard showing summary statistics of user activity.
      REQ-3: The system shall validate all form inputs before submission.
      
      If you cannot see enough detail in the design, make reasonable assumptions about what functionality would be needed for a complete application. Be creative but practical.
      
      Here is the simplified Figma design blueprint:
${simplifiedBlueprint}
    `;

    const response = await ApiService.callGeminiApi(prompt, 0.8, 2048, 'requirements');
    console.log('Requirements response:', response.substring(0, 500) + '...');
    
    // More flexible parsing to extract requirements in various formats
    const requirements = [];
    
    // Try to extract numbered requirements (REQ-X format)
    const reqPattern = /(REQ-\d+|Requirement \d+|\d+\.)\s*:?\s*(.+?)(?=\n\s*(?:REQ-\d+|Requirement \d+|\d+\.)|$)/gs;
    let match;
    let foundNumbered = false;
    
    while ((match = reqPattern.exec(response)) !== null) {
      const reqText = match[2].trim();
      if (reqText) {
        requirements.push(reqText);
        foundNumbered = true;
      }
    }
    
    // If no numbered requirements found, try line-by-line with filtering
    if (!foundNumbered) {
      const lines = response.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Include lines that are likely requirements (not headers, not empty)
        if (trimmedLine && 
            !trimmedLine.startsWith('#') && 
            trimmedLine.length > 15 && 
            !trimmedLine.endsWith(':')) {
          requirements.push(trimmedLine);
        }
      }
    }
    
    // If we still have no requirements, split by periods and get sentences
    if (requirements.length === 0) {
      const sentences = response.match(/[^.!?]+[.!?]+/g) || [];
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20) { // Only include substantive sentences
          requirements.push(trimmed);
        }
      }
    }
    
    // Return results, with fallback to ensure we always return something
    return requirements.length > 0 ? requirements : ["The system should implement all functionality visible in the design."];
  },

  // Generate complete application code (frontend + backend)
  generateApplication: async (figmaBlueprint, requirements) => {
    const simplifiedBlueprint = prepareFigmaBlueprint(figmaBlueprint);
    
    const formattedRequirements = requirements.map((req, index) => `${index + 1}. ${req}`).join('\n');
    
    const prompt = `
      You are an expert full-stack developer who specializes in creating web applications from designs. Your task is to generate the code for a complete application based on a Figma design blueprint and functional requirements.
      
      Generate a complete and working React-based frontend and any necessary backend code. Include all necessary HTML, CSS, and JavaScript.
      
      Here is the simplified Figma design blueprint:
${simplifiedBlueprint}

      And here are the functional requirements:
${formattedRequirements}

      Create a modern, responsive implementation with best practices. Include:
      1. Component structure and organization
      2. Styling (using CSS or a framework like Tailwind)
      3. State management
      4. API endpoints (if needed)
      5. Data models
      
      Return ONLY the code with no explanations. The code should be complete, functional, and ready to deploy.
    `;
    
    return await ApiService.callGeminiApi(prompt, 0.7, 8192, 'application');
  },

  // Generate test cases from functional requirements
  generateTestCases: async (requirements) => {
    // Format the requirements as a numbered list for clarity
    const formattedRequirements = requirements.map((req, index) => `${index + 1}. ${req}`).join('\n');
    
    const prompt = `
      You are an expert QA specialist. Your task is to generate comprehensive test cases for a web application based on a set of functional requirements.
      
      Here are the functional requirements for the application:
${formattedRequirements}

      Generate at least 8-12 test cases that thoroughly validate these requirements. For each test case, provide:
      1. A unique ID (TC-XXX format)
      2. A clear list of steps to perform
      3. The expected result
      
      Present your response as a JSON array where each object has the following properties:
      - id: string (the unique test case ID)
      - steps: array of strings (the test steps)
      - expectedResult: string (what should happen if the test passes)
      
      Example format:
      [{
        "id": "TC-001",
        "steps": ["Navigate to login page", "Enter valid credentials", "Click login button"],
        "expectedResult": "User should be successfully logged in and redirected to dashboard"
      }]
      
      Make your test cases specific, actionable, and thorough. Cover happy paths, edge cases, and error scenarios.
    `;
    
    const response = await ApiService.callGeminiApi(prompt, 0.7, 4096, 'testCases');
    console.log('Test cases response received, processing...');
    
    try {
      // Find JSON in the response (it might have additional text before/after)
      let jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
      let parsedTestCases;
      
      if (jsonMatch) {
        parsedTestCases = JSON.parse(jsonMatch[0]);
      } else {
        // Try to extract JSON from markdown code blocks
        jsonMatch = response.match(/```(?:json)?\s*\n?(\[\s*\{.*\}\s*\])\s*\n?```/s);
        if (jsonMatch) {
          parsedTestCases = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Could not extract JSON test cases from response');
        }
      }
      
      return parsedTestCases;
    } catch (error) {
      console.error('Error parsing test cases:', error);
      // Fallback: generate some basic test cases
      return requirements.map((req, index) => ({
        id: `TC-${String(index + 1).padStart(3, '0')}`,
        steps: ["Navigate to the relevant page", "Perform the required action", "Verify the response"],
        expectedResult: `The system successfully implements: ${req}`
      }));
    }
  },

  // Generate test scenarios from test cases and application code
  generateTestScenarios: async (testCases, applicationCode) => {
    // Format the test cases for the prompt
    const formattedTestCases = JSON.stringify(testCases, null, 2);
    
    // Create a condensed version of the app code to avoid token limits
    const condensedCode = applicationCode.substring(0, 15000); // Limit to avoid token limits
    
    const prompt = `
      You are an expert QA engineer specializing in test scenario design. Your task is to generate comprehensive test scenarios based on test cases and application code.
      
      Here are the test cases:
${formattedTestCases}

      Here is a portion of the application code:
${condensedCode}

      Create at least 5-8 detailed test scenarios that cover important user flows through the application. Each scenario should:
      1. Test a complete user journey or workflow
      2. Include multiple steps that connect related test cases
      3. Have clear preconditions and expected outcomes
      
      Present your response as a JSON array with each object having these properties:
      - id: string (unique scenario ID in format TS-XXX)
      - name: string (descriptive name of the scenario)
      - description: string (brief overview of what this scenario tests)
      - preconditions: string (setup required before running the scenario)
      - steps: array of strings (detailed steps for the scenario)
      - expectedOutcome: string (final result if the scenario passes)
      - testData: string (optional, any test data needed)
      
      Make your scenarios comprehensive and reflective of real user behavior. Include both happy paths and edge cases.
    `;
    
    const response = await ApiService.callGeminiApi(prompt, 0.7, 4096, 'testScenarios');
    console.log('Test scenarios response received, processing...');
    
    try {
      // Find JSON in the response (it might have additional text before/after)
      let jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
      let parsedScenarios;
      
      if (jsonMatch) {
        parsedScenarios = JSON.parse(jsonMatch[0]);
      } else {
        // Try to extract JSON from markdown code blocks
        jsonMatch = response.match(/```(?:json)?\s*\n?(\[\s*\{.*\}\s*\])\s*\n?```/s);
        if (jsonMatch) {
          parsedScenarios = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Could not extract JSON test scenarios from response');
        }
      }
      
      return parsedScenarios;
    } catch (error) {
      console.error('Error parsing test scenarios:', error);
      // Fallback: generate basic scenarios from test cases
      const scenarios = [];
      const groupSize = Math.max(1, Math.ceil(testCases.length / 5)); // Group test cases into ~5 scenarios
      
      for (let i = 0; i < testCases.length; i += groupSize) {
        const scenarioTestCases = testCases.slice(i, i + groupSize);
        scenarios.push({
          id: `TS-${String(Math.floor(i / groupSize) + 1).padStart(3, '0')}`,
          name: `Basic Scenario ${Math.floor(i / groupSize) + 1}`,
          description: `Tests functionality from test cases ${scenarioTestCases[0].id} to ${scenarioTestCases[scenarioTestCases.length - 1].id}`,
          preconditions: "User is logged in and has necessary permissions",
          steps: scenarioTestCases.flatMap(tc => tc.steps),
          expectedOutcome: "All tests pass successfully",
          testData: "N/A"
        });
      }
      
      return scenarios;
    }
  },

  // Generate test code for automated testing
  generateTestCode: async (testScenarios, framework = 'cypress') => {
    // Format the test scenarios for the prompt
    const formattedScenarios = JSON.stringify(testScenarios, null, 2);
    
    const prompt = `
      You are an expert test automation engineer. Your task is to convert test scenarios into automated test code using ${framework.charAt(0).toUpperCase() + framework.slice(1)}.
      
      Here are the test scenarios to automate:
${formattedScenarios}

      Generate complete, runnable ${framework} test code that implements these scenarios. Include:
      1. All necessary imports and setup
      2. Page objects or helper functions as needed
      3. Assertions to verify expected outcomes
      4. Proper error handling and reporting
      
      Make the code clean, maintainable, and following best practices for ${framework}. The code should be ready to run without major modifications.
    `;
    
    return await ApiService.callGeminiApi(prompt, 0.7, 4096, 'testCode');
  },

  // Generate a final report based on test results
  generateTestReport: async (testResults) => {
    // Format the test results for the prompt
    const formattedResults = JSON.stringify(testResults, null, 2);
    
    const prompt = `
      You are an expert QA manager preparing a final test report for stakeholders. Your task is to analyze test results and create a comprehensive report.
      
      Here are the raw test results:
${formattedResults}

      Generate a detailed test report that includes:
      1. Executive summary (with pass rate and overall assessment)
      2. Critical issues found (prioritized list of failed tests)
      3. Recommendations for fixing issues
      4. Readiness assessment (whether the application is ready for deployment)
      5. Next steps (what should be done before release)
      
      Format the report in a professional manner suitable for presentation to technical and non-technical stakeholders.
    `;
    
    return await ApiService.callGeminiApi(prompt, 0.7, 4096, 'testReport');
  }
};

export default ApiService;
