import axios from 'axios';

// Replace this with your actual Gemini API key
const GEMINI_API_KEY = 'AIzaSyCKlzvue7-sXoEr32rkLLgxgIv9PwGk1h4';
// Updated API URL to use latest version
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
  // Call Gemini API with proper headers and formatting
  callGeminiApi: async (prompt, temperature = 0.7, maxOutputTokens = 1024) => {
    try {
      console.log(`Calling Gemini API with prompt length: ${prompt.length} chars`);
      
      // Updated request payload format to match the latest Gemini API requirements
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
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

    const response = await ApiService.callGeminiApi(prompt, 0.8, 2048);
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
    return requirements.length > 0 ? requirements : [
      "The system shall provide a user interface based on the Figma design.",
      "The system shall implement all visual elements shown in the design.",
      "The system shall be responsive and adapt to different screen sizes.",
      "The system shall handle user interactions as implied by the design elements."
    ];
  },

  // Generate complete application code (frontend + backend)
  generateApplication: async (figmaBlueprint, requirements) => {
    // Prepare a simplified version of the blueprint
    const simplifiedBlueprint = prepareFigmaBlueprint(figmaBlueprint);
    
    const prompt = `
      You are a full-stack developer creating a complete web application based on a Figma design and a set of requirements.
      
      Figma Design Blueprint (simplified):
${simplifiedBlueprint}
      
      Functional Requirements:
${requirements.join('\n')}
      
      Generate a complete, standalone web application that includes:
      1. Frontend HTML structure with proper semantic elements
      2. CSS styling using Tailwind classes for responsive design
      3. JavaScript for frontend interactivity 
      4. A minimal backend (server code, routing, and data handling)
      5. All in a single HTML file using script and style tags
      
      The application should be fully functional according to the requirements, with clean code organization and comments.
      Use Tailwind CSS for styling and make the application responsive.
      
      Format your response as a complete HTML file ready to run, with embedded script and style tags.
    `;

    return await ApiService.callGeminiApi(prompt, 0.7, 8192);
  },

  // Generate test cases from functional requirements
  generateTestCases: async (requirements) => {
    const prompt = `
      You are a QA engineer. Based on these functional requirements, generate comprehensive test cases.
      
      For each requirement, create at least one test case with:
      - Test case ID
      - Test case name 
      - Description
      - Test steps (numbered list)
      - Expected result
      - Priority (High, Medium, Low)
      
      Functional Requirements:
${requirements.join('\n')}
    `;

    const response = await ApiService.callGeminiApi(prompt, 0.7, 4096);
    
    // Parse the response into structured test cases
    // This is a simplified parsing approach - in a real app you'd want more robust parsing
    const testCaseBlocks = response.split(/Test Case ID:/).slice(1);
    
    return testCaseBlocks.map(block => {
      const lines = block.split('\n').filter(line => line.trim());
      
      // Basic parsing - could be improved with regex
      const id = lines[0].trim();
      const name = lines.find(l => l.includes('Name:'))?.replace('Name:', '').trim() || '';
      const description = lines.find(l => l.includes('Description:'))?.replace('Description:', '').trim() || '';
      
      // Get steps between Steps: and Expected Result:
      const stepsStartIndex = lines.findIndex(l => l.includes('Steps:'));
      const expectedStartIndex = lines.findIndex(l => l.includes('Expected Result:'));
      const steps = lines.slice(stepsStartIndex + 1, expectedStartIndex)
        .map(step => step.trim())
        .filter(step => step);
      
      const expectedResult = lines.find(l => l.includes('Expected Result:'))?.replace('Expected Result:', '').trim() || '';
      const priority = lines.find(l => l.includes('Priority:'))?.replace('Priority:', '').trim() || 'Medium';
      
      return { id, name, description, steps, expectedResult, priority };
    });
  },

  // Generate test scenarios from test cases and application code
  generateTestScenarios: async (testCases, applicationCode) => {
    // Truncate application code if too large
    const truncatedCode = applicationCode.length > 5000 ? 
      applicationCode.substring(0, 5000) + '...[truncated for brevity]' : 
      applicationCode;
    
    const prompt = `
      You are a test architect. Based on these test cases and the application code, generate comprehensive test scenarios.
      Each test scenario should validate an entire workflow or user journey through the application.
      
      Test Cases:
${JSON.stringify(testCases, null, 2)}
      
      Application Code (truncated):
${truncatedCode}
      
      For each scenario, include:
      - Scenario ID and name
      - Description of the workflow being tested
      - Preconditions
      - Scenario steps (which may include multiple test cases)
      - Expected outcome
      - Test data required
    `;

    const response = await ApiService.callGeminiApi(prompt, 0.7, 4096);
    
    // Parse the response to extract scenarios
    const scenarioBlocks = response.split(/Scenario ID:/).slice(1);
    
    return scenarioBlocks.map(block => {
      const lines = block.split('\n').filter(line => line.trim());
      
      const id = lines[0].trim();
      const name = lines.find(l => l.includes('Name:'))?.replace('Name:', '').trim() || '';
      const description = lines.find(l => l.includes('Description:'))?.replace('Description:', '').trim() || '';
      const preconditions = lines.find(l => l.includes('Preconditions:'))?.replace('Preconditions:', '').trim() || '';
      
      // Get steps between Steps: and Expected Outcome:
      const stepsStartIndex = lines.findIndex(l => l.includes('Steps:'));
      const outcomeStartIndex = lines.findIndex(l => l.includes('Expected Outcome:'));
      const steps = stepsStartIndex >= 0 && outcomeStartIndex >= 0 ? 
        lines.slice(stepsStartIndex + 1, outcomeStartIndex)
          .map(step => step.trim())
          .filter(step => step) : [];
      
      const expectedOutcome = lines.find(l => l.includes('Expected Outcome:'))?.replace('Expected Outcome:', '').trim() || '';
      const testData = lines.find(l => l.includes('Test Data:'))?.replace('Test Data:', '').trim() || '';
      
      return { id, name, description, preconditions, steps, expectedOutcome, testData };
    });
  },

  // Generate test code for automated testing
  generateTestCode: async (testScenarios, framework = 'cypress') => {
    const prompt = `
      You are a QA automation engineer. Generate automated test code for the ${framework} framework based on these test scenarios:
      
      Test Scenarios:
${JSON.stringify(testScenarios, null, 2)}
      
      Create comprehensive test suites that cover all the scenarios. Include proper setup, assertions, and teardown.
      Use best practices for the ${framework} framework including page objects if appropriate.
      Make sure the tests are maintainable and robust.
    `;

    return await ApiService.callGeminiApi(prompt, 0.7, 8192);
  },

  // Generate a final report based on test results
  generateTestReport: async (testResults) => {
    const prompt = `
      As a QA manager, create a detailed test report based on these test results:
      
      Test Results:
${JSON.stringify(testResults, null, 2)}
      
      Include:
      1. Executive summary
      2. Test coverage statistics
      3. Passed/failed test breakdown
      4. Critical issues found
      5. Recommendations for fixes
      6. Certification status (whether the app is ready for deployment)
      
      Format the report in a professional manner with clear sections and bullet points where appropriate.
    `;

    return await ApiService.callGeminiApi(prompt, 0.7, 4096);
  }
};

export default ApiService;
