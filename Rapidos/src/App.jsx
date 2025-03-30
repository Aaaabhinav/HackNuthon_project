import { useState, useEffect } from 'react';
import './App.css';

// Figma API token
const FIGMA_API_TOKEN = 'figd_IBAmJi0BxWUtMQPcVqfFLGco9eOsjbO8mR380lag';

function App() {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [structureData, setStructureData] = useState(null);
  const [htmlData, setHtmlData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (urlError) setUrlError(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzeUrl();
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const extractFileKey = (url) => {
    console.log('Extracting file key from URL:', url);
    
    // More permissive regex that matches various Figma URL formats
    const match = url.match(/figma\.com\/(file|design|board|proto|community\/file)\/([a-zA-Z0-9_-]+)/i);
    
    if (match && match[2]) {
      console.log('Extracted file key:', match[2]);
      return match[2];
    }
    
    // Fallback extraction method if the regex fails
    const urlParts = url.split('/');
    for (let i = 0; i < urlParts.length; i++) {
      // Look for parts that might be a file key (alphanumeric, typically 22-44 chars)
      if (/^[a-zA-Z0-9_-]{10,}$/.test(urlParts[i])) {
        console.log('Fallback extracted file key:', urlParts[i]);
        return urlParts[i];
      }
    }
    
    throw new Error('Could not extract file key from URL');
  };

  const fetchFigmaFile = async (fileKey) => {
    try {
      console.log('Fetching Figma file with key:', fileKey);
      const apiUrl = `https://api.figma.com/v1/files/${fileKey}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Figma-Token': FIGMA_API_TOKEN
        }
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
      console.log('API response data received successfully');
      return data;
    } catch (error) {
      console.error('Error in fetchFigmaFile:', error);
      throw error;
    }
  };

  const fetchGenericUrl = async (url) => {
    try {
      console.log('Fetching generic URL:', url);
      
      // Use a CORS proxy for cross-origin requests
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
      
      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(responseData.contents);
        console.log('Successfully parsed response as JSON');
        return {
          type: 'json',
          data: jsonData,
          rawHtml: responseData.contents
        };
      } catch (e) {
        // If not JSON, treat as HTML
        console.log('Response is not JSON, treating as HTML');
        return {
          type: 'html',
          data: null,
          rawHtml: responseData.contents
        };
      }
    } catch (error) {
      console.error('Error in fetchGenericUrl:', error);
      throw error;
    }
  };

  const analyzeUrl = () => {
    const trimmedUrl = url.trim();
    
    // Basic URL validation
    if (!isValidUrl(trimmedUrl)) {
      setUrlError(true);
      return;
    }
    
    setUrlError(false);
    setIsLoading(true);
    setStructureData(null);
    setHtmlData(null);
    
    // Check if it's a Figma URL
    if (trimmedUrl.includes('figma.com')) {
      // Extract file key from URL
      try {
        const fileKey = extractFileKey(trimmedUrl);
        
        // Fetch file data from Figma API
        fetchFigmaFile(fileKey)
          .then(data => {
            // Display structure
            const formattedJson = JSON.stringify(data, null, 2);
            setStructureData(formattedJson);
            
            // Generate and display HTML
            const generatedHtml = generateHtml(data);
            setHtmlData(generatedHtml);
            
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching Figma file:', error);
            setStructureData(`Error: ${error.message}`);
            setHtmlData(`Error: ${error.message}`);
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error extracting file key:', error);
        setStructureData(`Error: ${error.message}`);
        setHtmlData(`Error: ${error.message}`);
        setIsLoading(false);
      }
    } else {
      // Handle non-Figma URLs
      fetchGenericUrl(trimmedUrl)
        .then(data => {
          // Extract and display structure
          const structure = createGenericStructure(data, trimmedUrl);
          const formattedJson = JSON.stringify(structure, null, 2);
          setStructureData(formattedJson);
          
          // Generate and display HTML
          const generatedHtml = generateGenericHtml(data, trimmedUrl);
          setHtmlData(generatedHtml);
          
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching URL:', error);
          setStructureData(`Error: ${error.message}`);
          setHtmlData(`Error: ${error.message}`);
          setIsLoading(false);
        });
    }
  };

  const createGenericStructure = (data, url) => {
    // Create a structure object to display
    const structure = {
      url: url,
      type: data.type,
      contentLength: data.rawHtml ? data.rawHtml.length : 0
    };
    
    // If it's JSON data, include that
    if (data.type === 'json' && data.data) {
      structure.data = data.data;
    } else if (data.type === 'html') {
      // For HTML, don't try to parse in React environment
      structure.htmlContent = 'HTML content available';
      structure.contentLength = data.rawHtml.length;
    }
    
    return structure;
  };
  
  const extractHeadings = (doc) => {
    const headings = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(el => {
        headings.push({
          type: tag,
          text: el.textContent.trim()
        });
      });
    });
    return headings;
  };
  
  const extractLinks = (doc) => {
    const links = [];
    const elements = doc.querySelectorAll('a[href]');
    elements.forEach(el => {
      links.push({
        text: el.textContent.trim(),
        href: el.getAttribute('href')
      });
    });
    return links.slice(0, 20); // Limit to 20 links
  };
  
  const extractImages = (doc) => {
    const images = [];
    const elements = doc.querySelectorAll('img[src]');
    elements.forEach(el => {
      images.push({
        alt: el.getAttribute('alt') || '',
        src: el.getAttribute('src')
      });
    });
    return images.slice(0, 20); // Limit to 20 images
  };
  
  const extractMetaTags = (doc) => {
    const meta = {};
    const elements = doc.querySelectorAll('meta');
    elements.forEach(el => {
      const name = el.getAttribute('name') || el.getAttribute('property');
      const content = el.getAttribute('content');
      if (name && content) {
        meta[name] = content;
      }
    });
    return meta;
  };

  const handleCopyHtml = () => {
    if (htmlData && navigator.clipboard) {
      navigator.clipboard.writeText(htmlData)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  const generateHtml = (figmaData) => {
    // Start with basic HTML structure
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Generated from Figma</title>\n  <style>\n';
    
    // Add CSS styles
    html += '    body {\n      margin: 0;\n      padding: 0;\n      font-family: sans-serif;\n    }\n';
    html += '    .container {\n      position: relative;\n    }\n';
    
    // Process document and extract styles
    const document = figmaData.document;
    const styles = figmaData.styles || {};
    
    // Add style definitions
    for (const styleId in styles) {
      const style = styles[styleId];
      html += `    /* ${style.name} */\n`;
      html += `    .style-${styleId.replace(':', '-')} {\n`;
      
      if (style.styleType === 'FILL') {
        html += '      /* Fill style */\n';
      } else if (style.styleType === 'TEXT') {
        html += '      /* Text style */\n';
      } else if (style.styleType === 'EFFECT') {
        html += '      /* Effect style */\n';
      } else if (style.styleType === 'GRID') {
        html += '      /* Grid style */\n';
      }
      
      html += '    }\n';
    }
    
    html += '  </style>\n</head>\n<body>\n';
    
    // Process canvas/pages
    if (document.children && document.children.length > 0) {
      // Process first page/canvas
      const firstPage = document.children[0];
      html += `  <!-- Page: ${firstPage.name} -->\n`;
      html += '  <div class="container">\n';
      
      // Process frames/artboards in the first page
      if (firstPage.children && firstPage.children.length > 0) {
        firstPage.children.forEach(frame => {
          html += processNode(frame, 2);
        });
      }
      
      html += '  </div>\n';
    }
    
    html += '</body>\n</html>';
    return html;
  };

  const processNode = (node, indentLevel = 0) => {
    const indent = '  '.repeat(indentLevel);
    let html = '';
    
    // Skip nodes that are not visible
    if (node.visible === false) {
      return '';
    }
    
    const nodeType = node.type;
    const nodeName = node.name || '';
    
    // Add comment with node info
    html += `${indent}<!-- ${nodeType}: ${nodeName} -->\n`;
    
    if (nodeType === 'FRAME' || nodeType === 'GROUP' || nodeType === 'COMPONENT' || nodeType === 'INSTANCE') {
      // Create a div for frames, groups, components, and instances
      const styles = getNodeStyles(node);
      html += `${indent}<div class="${getNodeClasses(node)}" style="${styles}">\n`;
      
      // Process children if they exist
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          html += processNode(child, indentLevel + 1);
        });
      }
      
      html += `${indent}</div>\n`;
    } else if (nodeType === 'RECTANGLE' || nodeType === 'ELLIPSE' || nodeType === 'POLYGON' || nodeType === 'STAR' || nodeType === 'VECTOR') {
      // Create a div for shapes
      const styles = getNodeStyles(node);
      html += `${indent}<div class="${getNodeClasses(node)}" style="${styles}"></div>\n`;
    } else if (nodeType === 'TEXT') {
      // Create a paragraph or heading for text
      const styles = getNodeStyles(node);
      const textContent = node.characters || '';
      
      // Determine if it's a heading based on font size or name
      const isHeading = (node.style && node.style.fontSize >= 16) || 
                       nodeName.toLowerCase().includes('heading') || 
                       nodeName.toLowerCase().includes('title');
      
      if (isHeading) {
        const headingLevel = Math.min(Math.floor((node.style?.fontSize || 16) / 8), 6) || 2;
        html += `${indent}<h${headingLevel} class="${getNodeClasses(node)}" style="${styles}">${textContent}</h${headingLevel}>\n`;
      } else {
        html += `${indent}<p class="${getNodeClasses(node)}" style="${styles}">${textContent}</p>\n`;
      }
    } else if (nodeType === 'LINE') {
      // Create a horizontal rule for lines
      html += `${indent}<hr style="${getNodeStyles(node)}">\n`;
    } else if (nodeType === 'IMAGE') {
      // Create an image placeholder
      html += `${indent}<div class="${getNodeClasses(node)} image-placeholder" style="${getNodeStyles(node)}">Image: ${nodeName}</div>\n`;
    } else {
      // Generic div for other node types
      const styles = getNodeStyles(node);
      html += `${indent}<div class="${getNodeClasses(node)}" style="${styles}">\n`;
      
      // Process children if they exist
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          html += processNode(child, indentLevel + 1);
        });
      }
      
      html += `${indent}</div>\n`;
    }
    
    return html;
  };

  const getNodeClasses = (node) => {
    const classes = [`node-${node.type.toLowerCase()}`];
    
    // Add class based on node name (kebab-case)
    if (node.name) {
      classes.push(`node-${node.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
    
    // Add classes for style references
    if (node.styles) {
      for (const styleType in node.styles) {
        const styleId = node.styles[styleType];
        classes.push(`style-${styleId.replace(':', '-')}`);
      }
    }
    
    return classes.join(' ');
  };

  const getNodeStyles = (node) => {
    const styles = [];
    
    // Position and size
    if (node.absoluteBoundingBox) {
      const box = node.absoluteBoundingBox;
      styles.push(`position: absolute`);
      styles.push(`left: ${box.x}px`);
      styles.push(`top: ${box.y}px`);
      styles.push(`width: ${box.width}px`);
      styles.push(`height: ${box.height}px`);
    } else if (node.size) {
      styles.push(`width: ${node.size.x}px`);
      styles.push(`height: ${node.size.y}px`);
    }
    
    // Opacity
    if (typeof node.opacity === 'number') {
      styles.push(`opacity: ${node.opacity}`);
    }
    
    // Background
    if (node.fills && node.fills.length > 0) {
      const solidFill = node.fills.find(fill => fill.type === 'SOLID' && fill.visible !== false);
      if (solidFill) {
        const { r, g, b, a } = solidFill.color;
        const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        styles.push(`background-color: ${rgba}`);
      }
      
      // Handle gradient fills
      const gradientFill = node.fills.find(fill => 
        (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') && 
        fill.visible !== false
      );
      
      if (gradientFill) {
        if (gradientFill.type === 'GRADIENT_LINEAR') {
          styles.push(`background: linear-gradient(to bottom, ${getGradientColors(gradientFill)})`);
        } else if (gradientFill.type === 'GRADIENT_RADIAL') {
          styles.push(`background: radial-gradient(circle, ${getGradientColors(gradientFill)})`);
        }
      }
    }
    
    return styles.join('; ');
  };

  const getGradientColors = (gradientFill) => {
    const gradientColors = [];
    gradientFill.gradientStops.forEach(stop => {
      const { r, g, b, a } = stop.color;
      const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      gradientColors.push(rgba);
    });
    return gradientColors.join(', ');
  };

  const generateGenericHtml = (data, url) => {
    // Start with basic HTML structure
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    
    if (data.type === 'html') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.rawHtml, 'text/html');
        
        // Extract title if available
        const title = doc.title || url;
        html += `  <title>${title}</title>\n`;
        
        // Extract and include meta tags
        const metaTags = doc.querySelectorAll('meta');
        metaTags.forEach(tag => {
          const name = tag.getAttribute('name');
          const property = tag.getAttribute('property');
          const content = tag.getAttribute('content');
          
          if ((name || property) && content) {
            html += `  <meta ${name ? `name="${name}"` : `property="${property}"`} content="${content}">\n`;
          }
        });
        
        html += '  <style>\n';
        html += '    body {\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n      max-width: 1200px;\n      margin: 0 auto;\n      padding: 20px;\n    }\n';
        html += '    img {\n      max-width: 100%;\n      height: auto;\n    }\n';
        html += '    .url-info {\n      background-color: #f5f5f5;\n      padding: 10px;\n      border-radius: 5px;\n      margin-bottom: 20px;\n    }\n';
        html += '    .section {\n      margin-bottom: 20px;\n      border-bottom: 1px solid #eee;\n      padding-bottom: 20px;\n    }\n';
        html += '    .resources {\n      display: grid;\n      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));\n      gap: 20px;\n    }\n';
        html += '    .resource-item {\n      border: 1px solid #ddd;\n      padding: 10px;\n      border-radius: 5px;\n    }\n';
        html += '  </style>\n';
        html += '</head>\n<body>\n';
        
        // URL info
        html += '  <div class="url-info">\n';
        html += `    <h1>${title}</h1>\n`;
        html += `    <p>Source: <a href="${url}" target="_blank">${url}</a></p>\n`;
        html += '  </div>\n';
        
        // Headings section
        const headings = extractHeadings(doc);
        if (headings.length > 0) {
          html += '  <div class="section">\n';
          html += '    <h2>Document Structure</h2>\n';
          html += '    <ul>\n';
          
          headings.forEach(heading => {
            html += `      <li>${heading.type}: ${heading.text}</li>\n`;
          });
          
          html += '    </ul>\n';
          html += '  </div>\n';
        }
        
        // Links section
        const links = extractLinks(doc);
        if (links.length > 0) {
          html += '  <div class="section">\n';
          html += '    <h2>Links</h2>\n';
          html += '    <div class="resources">\n';
          
          links.forEach(link => {
            html += '      <div class="resource-item">\n';
            html += `        <a href="${link.href}" target="_blank">${link.text || link.href}</a>\n`;
            html += '      </div>\n';
          });
          
          html += '    </div>\n';
          html += '  </div>\n';
        }
        
        // Images section
        const images = extractImages(doc);
        if (images.length > 0) {
          html += '  <div class="section">\n';
          html += '    <h2>Images</h2>\n';
          html += '    <div class="resources">\n';
          
          images.forEach(image => {
            html += '      <div class="resource-item">\n';
            html += `        <img src="${image.src}" alt="${image.alt}">\n`;
            html += `        <p>${image.alt || 'Image'}</p>\n`;
            html += '      </div>\n';
          });
          
          html += '    </div>\n';
          html += '  </div>\n';
        }
        
      } catch (e) {
        console.error('Error generating HTML from parsed content:', e);
        
        // Fallback to basic structure
        html += `  <title>Analysis of ${url}</title>\n`;
        html += '  <style>\n';
        html += '    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }\n';
        html += '  </style>\n';
        html += '</head>\n<body>\n';
        html += `  <h1>Analysis of ${url}</h1>\n`;
        html += `  <p>Could not fully parse HTML content: ${e.message}</p>\n`;
        html += `  <pre>${data.rawHtml.substring(0, 1000)}...</pre>\n`;
      }
    } else if (data.type === 'json') {
      // Handle JSON data
      html += `  <title>JSON Data from ${url}</title>\n`;
      html += '  <style>\n';
      html += '    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }\n';
      html += '    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }\n';
      html += '  </style>\n';
      html += '</head>\n<body>\n';
      html += `  <h1>JSON Data from ${url}</h1>\n`;
      html += '  <pre>\n';
      html += JSON.stringify(data.data, null, 2);
      html += '\n  </pre>\n';
    } else {
      // Generic fallback
      html += `  <title>Analysis of ${url}</title>\n`;
      html += '  <style>\n';
      html += '    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }\n';
      html += '  </style>\n';
      html += '</head>\n<body>\n';
      html += `  <h1>Analysis of ${url}</h1>\n`;
      html += `  <p>Content type: ${data.type}</p>\n`;
    }
    
    html += '</body>\n</html>';
    return html;
  };

  return (
    <div className="app">
      <header>
        <h1>Rapidos</h1>
        <p>Analyze URLs and convert designs to HTML</p>
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
        
        {!isLoading && structureData && (
          <div className="results">
            <div className="section">
              <h2>Structure</h2>
              <pre>{structureData}</pre>
            </div>
            
            <div className="section">
              <h2>Generated HTML
                <button 
                  className="copy-button" 
                  onClick={handleCopyHtml}
                  title="Copy HTML to clipboard"
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </h2>
              <pre>{htmlData}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;