document.addEventListener('DOMContentLoaded', () => {
    const figmaUrlInput = document.getElementById('figmaUrl');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const urlError = document.getElementById('urlError');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const structureOutput = document.getElementById('structureOutput');
    const htmlOutput = document.getElementById('htmlOutput');
    const copyHtmlBtn = document.getElementById('copyHtmlBtn');

    // Figma API token - embedded in the code as requested
    const FIGMA_API_TOKEN = 'figd_IBAmJi0BxWUtMQPcVqfFLGco9eOsjbO8mR380lag';

    analyzeBtn.addEventListener('click', () => {
        analyzeUrl();
    });

    figmaUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            analyzeUrl();
        }
    });

    copyHtmlBtn.addEventListener('click', () => {
        const htmlText = htmlOutput.querySelector('pre').textContent;
        navigator.clipboard.writeText(htmlText)
            .then(() => {
                const originalText = copyHtmlBtn.textContent;
                copyHtmlBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyHtmlBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });

    function analyzeUrl() {
        const url = figmaUrlInput.value.trim();
        
        // Basic URL validation
        if (!isValidUrl(url)) {
            urlError.classList.remove('d-none');
            return;
        }
        
        urlError.classList.add('d-none');
        loadingIndicator.classList.remove('d-none');
        structureOutput.innerHTML = '<div class="placeholder-text">Analyzing...</div>';
        htmlOutput.innerHTML = '<div class="placeholder-text">Generating HTML...</div>';
        copyHtmlBtn.classList.add('d-none');
        
        // Check if it's a Figma URL
        if (url.includes('figma.com')) {
            // Extract file key from URL
            try {
                const fileKey = extractFileKey(url);
                
                // Fetch file data from Figma API
                fetchFigmaFile(fileKey)
                    .then(data => {
                        // Display structure
                        displayStructure(data);
                        
                        // Generate and display HTML
                        const generatedHtml = generateHtml(data);
                        displayHtml(generatedHtml);
                        
                        loadingIndicator.classList.add('d-none');
                        copyHtmlBtn.classList.remove('d-none');
                    })
                    .catch(error => {
                        console.error('Error fetching Figma file:', error);
                        structureOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                        htmlOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                        loadingIndicator.classList.add('d-none');
                    });
            } catch (error) {
                console.error('Error extracting file key:', error);
                structureOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                htmlOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                loadingIndicator.classList.add('d-none');
            }
        } else {
            // Handle non-Figma URLs
            fetchGenericUrl(url)
                .then(data => {
                    // Display structure
                    displayGenericStructure(data, url);
                    
                    // Generate and display HTML
                    const generatedHtml = generateGenericHtml(data, url);
                    displayHtml(generatedHtml);
                    
                    loadingIndicator.classList.add('d-none');
                    copyHtmlBtn.classList.remove('d-none');
                })
                .catch(error => {
                    console.error('Error fetching URL:', error);
                    structureOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                    htmlOutput.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
                    loadingIndicator.classList.add('d-none');
                });
        }
    }

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    function extractFileKey(url) {
        // Extract file key from URL
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
    }

    async function fetchFigmaFile(fileKey) {
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
    }

    async function fetchGenericUrl(url) {
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
    }

    function displayStructure(data) {
        // Format and display the JSON structure
        const formattedJson = JSON.stringify(data, null, 2);
        const highlightedJson = highlightJson(formattedJson);
        structureOutput.innerHTML = `<pre>${highlightedJson}</pre>`;
    }

    function displayGenericStructure(data, url) {
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
            // For HTML, extract some basic structure info
            const parser = new DOMParser();
            try {
                const doc = parser.parseFromString(data.rawHtml, 'text/html');
                
                // Extract basic page info
                structure.title = doc.title;
                structure.headings = extractHeadings(doc);
                structure.links = extractLinks(doc);
                structure.images = extractImages(doc);
                structure.meta = extractMetaTags(doc);
            } catch (e) {
                console.error('Error parsing HTML:', e);
                structure.parsingError = e.message;
            }
        }
        
        // Format and display the structure
        const formattedJson = JSON.stringify(structure, null, 2);
        const highlightedJson = highlightJson(formattedJson);
        structureOutput.innerHTML = `<pre>${highlightedJson}</pre>`;
    }
    
    function extractHeadings(doc) {
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
    }
    
    function extractLinks(doc) {
        const links = [];
        const elements = doc.querySelectorAll('a[href]');
        elements.forEach(el => {
            links.push({
                text: el.textContent.trim(),
                href: el.getAttribute('href')
            });
        });
        return links.slice(0, 20); // Limit to 20 links
    }
    
    function extractImages(doc) {
        const images = [];
        const elements = doc.querySelectorAll('img[src]');
        elements.forEach(el => {
            images.push({
                alt: el.getAttribute('alt') || '',
                src: el.getAttribute('src')
            });
        });
        return images.slice(0, 20); // Limit to 20 images
    }
    
    function extractMetaTags(doc) {
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
    }

    function generateHtml(figmaData) {
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
    }

    function generateGenericHtml(data, url) {
        if (data.type === 'html' && data.rawHtml) {
            // For HTML content, create a simplified version
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.rawHtml, 'text/html');
            
            // Start with basic HTML structure
            let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
            
            // Add title
            html += `  <title>${doc.title || 'Generated from URL'}</title>\n`;
            
            // Add basic styles
            html += '  <style>\n';
            html += '    body {\n      margin: 0;\n      padding: 20px;\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n    }\n';
            html += '    .container {\n      max-width: 1200px;\n      margin: 0 auto;\n    }\n';
            html += '    img {\n      max-width: 100%;\n      height: auto;\n    }\n';
            html += '    a {\n      color: #0066cc;\n      text-decoration: none;\n    }\n';
            html += '    a:hover {\n      text-decoration: underline;\n    }\n';
            html += '  </style>\n';
            html += '</head>\n<body>\n';
            
            // Add container
            html += '  <div class="container">\n';
            
            // Add title
            if (doc.title) {
                html += `    <h1>${doc.title}</h1>\n`;
            }
            
            // Add source URL
            html += `    <p>Source: <a href="${url}" target="_blank">${url}</a></p>\n`;
            
            // Add main content (simplified)
            const mainContent = doc.querySelector('main') || doc.querySelector('article') || doc.body;
            if (mainContent) {
                // Get all headings, paragraphs, and images
                const elements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, ul, ol');
                elements.forEach(el => {
                    const tagName = el.tagName.toLowerCase();
                    if (tagName.match(/^h[1-6]$/)) {
                        html += `    <${tagName}>${el.textContent}</${tagName}>\n`;
                    } else if (tagName === 'p') {
                        html += `    <p>${el.textContent}</p>\n`;
                    } else if (tagName === 'img' && el.getAttribute('src')) {
                        const src = el.getAttribute('src');
                        const alt = el.getAttribute('alt') || '';
                        html += `    <img src="${src}" alt="${alt}">\n`;
                    } else if (tagName === 'ul' || tagName === 'ol') {
                        html += `    <${tagName}>\n`;
                        const items = el.querySelectorAll('li');
                        items.forEach(item => {
                            html += `      <li>${item.textContent}</li>\n`;
                        });
                        html += `    </${tagName}>\n`;
                    }
                });
            }
            
            html += '  </div>\n';
            html += '</body>\n</html>';
            
            return html;
        } else if (data.type === 'json' && data.data) {
            // For JSON content, create a representation
            let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
            html += '  <title>Generated from JSON</title>\n';
            
            // Add basic styles
            html += '  <style>\n';
            html += '    body {\n      margin: 0;\n      padding: 20px;\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n    }\n';
            html += '    .container {\n      max-width: 1200px;\n      margin: 0 auto;\n    }\n';
            html += '    .json-key {\n      color: #0066cc;\n    }\n';
            html += '    .json-string {\n      color: #008800;\n    }\n';
            html += '    .json-number {\n      color: #aa22ff;\n    }\n';
            html += '    .json-boolean {\n      color: #ee6600;\n    }\n';
            html += '    .json-null {\n      color: #666666;\n    }\n';
            html += '    pre {\n      background-color: #f8f9fa;\n      padding: 15px;\n      border-radius: 5px;\n      overflow-x: auto;\n    }\n';
            html += '  </style>\n';
            html += '</head>\n<body>\n';
            
            // Add container
            html += '  <div class="container">\n';
            
            // Add title and source
            html += '    <h1>JSON Data</h1>\n';
            html += `    <p>Source: <a href="${url}" target="_blank">${url}</a></p>\n`;
            
            // Add JSON content
            html += '    <pre>\n';
            html += highlightJson(JSON.stringify(data.data, null, 2));
            html += '    </pre>\n';
            
            html += '  </div>\n';
            html += '</body>\n</html>';
            
            return html;
        } else {
            // Fallback for unknown content
            return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated from URL</title>
</head>
<body>
  <h1>Content from ${url}</h1>
  <p>The content type could not be determined.</p>
</body>
</html>`;
        }
    }

    function processNode(node, indentLevel = 0) {
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
    }

    function getNodeClasses(node) {
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
    }

    function getNodeStyles(node) {
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
        
        // Border
        if (node.strokes && node.strokes.length > 0) {
            const stroke = node.strokes[0];
            if (stroke.type === 'SOLID') {
                const { r, g, b, a } = stroke.color;
                const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
                
                if (node.strokeWeight) {
                    styles.push(`border: ${node.strokeWeight}px solid ${rgba}`);
                } else {
                    styles.push(`border: 1px solid ${rgba}`);
                }
            }
        }
        
        // Border radius
        if (node.cornerRadius) {
            styles.push(`border-radius: ${node.cornerRadius}px`);
        }
        
        // Text styles
        if (node.style) {
            const { fontFamily, fontWeight, fontSize, letterSpacing, lineHeightPx, textAlignHorizontal, textAlignVertical } = node.style;
            
            if (fontFamily) styles.push(`font-family: ${fontFamily}, sans-serif`);
            if (fontWeight) styles.push(`font-weight: ${fontWeight}`);
            if (fontSize) styles.push(`font-size: ${fontSize}px`);
            if (letterSpacing) styles.push(`letter-spacing: ${letterSpacing}px`);
            if (lineHeightPx) styles.push(`line-height: ${lineHeightPx}px`);
            
            if (textAlignHorizontal) {
                let textAlign = textAlignHorizontal.toLowerCase();
                if (textAlign === 'justified') textAlign = 'justify';
                styles.push(`text-align: ${textAlign}`);
            }
            
            if (textAlignVertical) {
                let verticalAlign = 'middle';
                if (textAlignVertical.toLowerCase() === 'top') verticalAlign = 'flex-start';
                if (textAlignVertical.toLowerCase() === 'bottom') verticalAlign = 'flex-end';
                styles.push(`display: flex`);
                styles.push(`align-items: ${verticalAlign}`);
            }
        }
        
        // Effects (shadows)
        if (node.effects && node.effects.length > 0) {
            const shadows = node.effects.filter(effect => 
                (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') && 
                effect.visible !== false
            );
            
            if (shadows.length > 0) {
                const shadowStyles = shadows.map(shadow => {
                    const { offset, radius, color, type } = shadow;
                    const { r, g, b, a } = color;
                    const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
                    const x = offset?.x || 0;
                    const y = offset?.y || 0;
                    
                    return `${type === 'INNER_SHADOW' ? 'inset ' : ''}${x}px ${y}px ${radius}px ${rgba}`;
                }).join(', ');
                
                styles.push(`box-shadow: ${shadowStyles}`);
            }
        }
        
        return styles.join('; ');
    }

    function getGradientColors(gradientFill) {
        if (!gradientFill.gradientStops || gradientFill.gradientStops.length === 0) {
            return 'transparent, transparent';
        }
        
        return gradientFill.gradientStops.map(stop => {
            const { r, g, b, a } = stop.color;
            const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
            return `${rgba} ${Math.round(stop.position * 100)}%`;
        }).join(', ');
    }

    function displayHtml(html) {
        // Format and display the generated HTML
        const highlightedHtml = highlightHtml(html);
        htmlOutput.innerHTML = `<pre>${highlightedHtml}</pre>`;
    }

    function highlightHtml(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/(".*?")/g, '<span class="html-value">$1</span>')
            .replace(/(&lt;[\/]?)([\w\d-]+)/g, '$1<span class="html-tag">$2</span>')
            .replace(/(\s+)([\w\d-]+)=/g, '$1<span class="html-attribute">$2</span>=');
    }

    function highlightJson(json) {
        return json
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        match = match.replace(/"/g, '').replace(/:$/, '');
                        return `<span class="${cls}">"${match}"</span>:`;
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
    }
});
