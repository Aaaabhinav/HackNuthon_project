import { useState } from 'react';
import './App.css';

// Figma API token
const FIGMA_API_TOKEN = 'figd_IBAmJi0BxWUtMQPcVqfFLGco9eOsjbO8mR380lag';

function App() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [blueprintData, setBlueprintData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Update URL and clear error if any.
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (urlError) setUrlError(false);
  };

  // Trigger analysis on Enter key press.
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeUrl();
    }
  };

  // Basic URL validation.
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Extract the file key from various Figma URL formats.
  const extractFileKey = (url) => {
    console.log('Extracting file key from URL:', url);
    const match = url.match(/figma\.com\/(file|design|board|proto|community\/file)\/([a-zA-Z0-9_-]+)/i);
    if (match && match[2]) {
      console.log('Extracted file key:', match[2]);
      return match[2];
    }
    const urlParts = url.split('/');
    for (let i = 0; i < urlParts.length; i++) {
      if (/^[a-zA-Z0-9_-]{10,}$/.test(urlParts[i])) {
        console.log('Fallback extracted file key:', urlParts[i]);
        return urlParts[i];
      }
    }
    throw new Error('Could not extract file key from URL');
  };

  /**
   * Recursively filter the Figma node to extract essential details.
   * This function captures:
   * 
   * 1. Design Structure & Layout:
   *    - Page/Frame hierarchy, names, dimensions (x, y, width, height)
   *    - Constraints, auto-layout (layoutMode) and grid settings (layoutGrids)
   * 2. Visual Elements & Styling:
   *    - For TEXT: text content, font family, font size, font weight, line height, letter spacing, text alignment
   *    - For shapes (RECTANGLE, ELLIPSE, POLYGON, STAR, VECTOR): corner radius, fills (colors), strokes, effects
   *    - For IMAGE: image reference and scaling info.
   * 3. Interactive Elements & User Flows:
   *    - Prototype connections (if available) and interactions.
   *    - For interactive components (buttons, form fields): overrides and states.
   * 4. Data & Logic (Backend Considerations):
   *    - Data placeholders (if text includes dynamic content markers).
   *    - Component names that hint at API endpoints or form data.
   */
  const filterFigmaNode = (node) => {
    // Start with common properties.
    const filteredNode = {
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // 1. Design Structure & Layout
    if (node.absoluteBoundingBox) {
      filteredNode.absoluteBoundingBox = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      };
    }
    if (node.constraints) {
      filteredNode.constraints = node.constraints;
    }
    if (node.layoutMode) {
      filteredNode.layoutMode = node.layoutMode;
      // You can also include alignment properties if needed.
      filteredNode.primaryAxisAlignItems = node.primaryAxisAlignItems;
      filteredNode.counterAxisAlignItems = node.counterAxisAlignItems;
    }
    if (node.layoutGrids) {
      filteredNode.layoutGrids = node.layoutGrids;
    }

    // 2. Visual Elements & Styling
    if (node.type === 'TEXT') {
      filteredNode.characters = node.characters || '';
      if (node.style) {
        filteredNode.style = {
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
          fontWeight: node.style.fontWeight,
          lineHeightPx: node.style.lineHeightPx,
          letterSpacing: node.style.letterSpacing,
          textAlign: node.style.textAlign, // May be 'LEFT', 'RIGHT', etc.
        };
      }
      // Detect potential data placeholders in text (e.g. {username})
      if (node.characters && node.characters.match(/{\w+}/)) {
        filteredNode.isPlaceholder = true;
      }
    }

    // For shapes (RECTANGLE, ELLIPSE, POLYGON, STAR, VECTOR)
    if (['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR'].includes(node.type)) {
      if (node.cornerRadius !== undefined) {
        filteredNode.cornerRadius = node.cornerRadius;
      }
      if (node.fills) {
        filteredNode.fills = node.fills.map(fill => ({
          type: fill.type,
          visible: fill.visible,
          color: fill.color ? fill.color : undefined,
          gradientStops: fill.gradientStops ? fill.gradientStops : undefined,
        }));
      }
      if (node.strokes) {
        filteredNode.strokes = node.strokes.map(stroke => ({
          type: stroke.type,
          color: stroke.color,
        }));
      }
      if (node.effects) {
        filteredNode.effects = node.effects; // Includes shadows, blurs, etc.
      }
    }

    // For images.
    if (node.type === 'IMAGE') {
      filteredNode.imageRef = node.imageRef || null;
      filteredNode.scaleFactor = node.scaleFactor || undefined;
    }

    // 3. Interactive Elements & User Flows
    // Capture prototype connections & interactions if present.
    if (node.prototypeNodeID || node.interactions) {
      filteredNode.prototypeConnections = node.prototypeNodeID
        ? [node.prototypeNodeID]
        : [];
      if (node.interactions) {
        filteredNode.interactions = node.interactions;
      }
    }
    // For interactive components, capture overrides (commonly on instances or components).
    if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
      filteredNode.overrides = node.overrides || null;
    }

    // 4. Data & Logic (Backend Considerations)
    // Include the node name which may hint at API endpoints (e.g., "user list", "login form").
    // For form fields, the name may be used to infer input types.
    if (node.name) {
      filteredNode.inferredFunction = node.name.toLowerCase();
    }

    // Recursively filter children nodes to maintain layer hierarchy.
    if (node.children && node.children.length > 0) {
      filteredNode.children = node.children.map(child => filterFigmaNode(child));
    }

    return filteredNode;
  };

  // Fetch Figma file and apply the deep filter to generate a detailed design blueprint.
  const fetchFigmaFile = async (fileKey) => {
    try {
      console.log('Fetching Figma file with key:', fileKey);
      const apiUrl = `https://api.figma.com/v1/files/${fileKey}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Figma-Token': FIGMA_API_TOKEN,
        },
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: 'Unknown API error' };
        }
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Filter the entire document recursively with the additional design details.
      const filteredDocument = filterFigmaNode(data.document);

      // Build the blueprint JSON for further processing by a generative AI.
      const blueprint = {
        document: filteredDocument,
      };

      console.log('Blueprint data prepared:', blueprint);
      return blueprint;
    } catch (error) {
      console.error('Error in fetchFigmaFile:', error);
      throw error;
    }
  };

  // For non-Figma URLs, fetch generic content (if needed).
  const fetchGenericUrl = async (url) => {
    try {
      console.log('Fetching generic URL:', url);
      const corsProxy = 'https://api.allorigins.win/get?url=';
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = corsProxy + encodedUrl;
      console.log('Using CORS proxy:', proxyUrl);
      const response = await fetch(proxyUrl);
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const responseData = await response.json();
      if (!responseData.contents) {
        throw new Error('No content returned from URL');
      }
      try {
        const jsonData = JSON.parse(responseData.contents);
        console.log('Successfully parsed response as JSON');
        return { type: 'json', data: jsonData, rawHtml: responseData.contents };
      } catch (e) {
        console.log('Response is not JSON, treating as HTML');
        return { type: 'html', data: null, rawHtml: responseData.contents };
      }
    } catch (error) {
      console.error('Error in fetchGenericUrl:', error);
      throw error;
    }
  };

  // Analyze the URL: if it's a Figma URL, fetch and filter its data; otherwise, handle generic content.
  const analyzeUrl = () => {
    const trimmedUrl = url.trim();
    if (!isValidUrl(trimmedUrl)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    setIsLoading(true);
    setBlueprintData(null);

    if (trimmedUrl.includes('figma.com')) {
      try {
        const fileKey = extractFileKey(trimmedUrl);
        fetchFigmaFile(fileKey)
          .then((blueprint) => {
            // Display the design blueprint JSON.
            setBlueprintData(JSON.stringify(blueprint, null, 2));
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching Figma file:', error);
            setBlueprintData(`Error: ${error.message}`);
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error extracting file key:', error);
        setBlueprintData(`Error: ${error.message}`);
        setIsLoading(false);
      }
    } else {
      // For non-Figma URLs, use the generic fetch (if needed).
      fetchGenericUrl(trimmedUrl)
        .then((data) => {
          const structure = {
            url: trimmedUrl,
            type: data.type,
            contentLength: data.rawHtml ? data.rawHtml.length : 0,
          };
          setBlueprintData(JSON.stringify(structure, null, 2));
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching URL:', error);
          setBlueprintData(`Error: ${error.message}`);
          setIsLoading(false);
        });
    }
  };

  // Copy the blueprint JSON to the clipboard.
  const handleCopyBlueprint = () => {
    if (blueprintData && navigator.clipboard) {
      navigator.clipboard.writeText(blueprintData)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Rapidos</h1>
        <p>Analyze Figma URLs and generate a detailed design blueprint for full‑stack development</p>
      </header>
      <main>
        <div className="url-input">
          <div className="input-group">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter a URL (including Figma links)"
              className={urlError ? 'error' : ''}
            />
            <button onClick={analyzeUrl} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          {urlError && <p className="error-message">Please enter a valid URL</p>}
        </div>

        {isLoading && (
          <div className="loading">
            <p>Analyzing URL data...</p>
          </div>
        )}

        {!isLoading && blueprintData && (
          <div className="results">
            <div className="section">
              <h2>
                Design Blueprint (JSON)
                <button
                  className="copy-button"
                  onClick={handleCopyBlueprint}
                  title="Copy JSON to clipboard"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </h2>
              <pre>{blueprintData}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
