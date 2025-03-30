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

  // Update URL and clear any error
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (urlError) setUrlError(false);
  };

  // Trigger analysis on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeUrl();
    }
  };

  // Basic URL validation
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Extract file key from different Figma URL formats
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

  // Recursively filter each Figma node to include only required details
  const filterFigmaNode = (node) => {
    // Create a filtered node with the essential fields.
    const filteredNode = {
      id: node.id,
      name: node.name,
      type: node.type
    };

    // Include layout details if available.
    if (node.absoluteBoundingBox) {
      filteredNode.absoluteBoundingBox = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      };
    }

    // For text nodes, include characters and minimal style info.
    if (node.type === 'TEXT') {
      filteredNode.characters = node.characters || '';
      if (node.style) {
        filteredNode.style = {
          fontSize: node.style.fontSize,
          fontFamily: node.style.fontFamily,
          fontWeight: node.style.fontWeight,
          lineHeightPx: node.style.lineHeightPx
        };
      }
    }

    // If the node has children, recursively filter them.
    if (node.children && node.children.length > 0) {
      filteredNode.children = node.children.map(child => filterFigmaNode(child));
    }

    return filteredNode;
  };

  // Fetch Figma file and filter the response to only include blueprint details.
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

      // Filter the document recursively.
      const filteredDocument = filterFigmaNode(data.document);

      // Construct the blueprint JSON for the generative AI model.
      const blueprint = {
        document: filteredDocument
      };

      console.log('Blueprint data prepared:', blueprint);
      return blueprint;
    } catch (error) {
      console.error('Error in fetchFigmaFile:', error);
      throw error;
    }
  };

  // For non-Figma URLs, fetch generic content (if needed for other purposes)
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

  // Analyze the URL: if Figma URL, fetch and filter its data; otherwise, handle generic content.
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
            // Blueprint is a minimal JSON object representing the design.
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
      // For non-Figma URLs, use the generic fetch (if needed)
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

  // Copy blueprint JSON to clipboard
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
        <p>Analyze Figma URLs and generate a design blueprint for full‑stack development</p>
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
