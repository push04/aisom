const requestCounts = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS_PER_MINUTE = 10

function checkRateLimit(clientId) {
  const now = Date.now()
  const requestData = requestCounts.get(clientId) || { count: 0, windowStart: now }
  
  if (now - requestData.windowStart > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientId, { count: 1, windowStart: now })
    return true
  }
  
  if (requestData.count >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  requestData.count++
  requestCounts.set(clientId, requestData)
  return true
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const origin = event.headers.origin || ''
  const referer = event.headers.referer || ''
  const deployedUrl = process.env.URL || 'https://structuralvision-ai.netlify.app'
  
  const allowedOrigins = [
    deployedUrl,
    'http://localhost:5000',
    'http://localhost:8888',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:8888'
  ]
  
  let isValidOrigin = false
  let matchedOrigin = deployedUrl
  
  if (origin) {
    isValidOrigin = allowedOrigins.includes(origin)
    if (isValidOrigin) matchedOrigin = origin
  } else if (referer) {
    for (const allowed of allowedOrigins) {
      if (referer.startsWith(allowed + '/') || referer === allowed) {
        isValidOrigin = true
        matchedOrigin = allowed
        break
      }
    }
  }
  
  if (!isValidOrigin) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden - Invalid or missing origin' }),
      headers: {
        'Access-Control-Allow-Origin': deployedUrl
      }
    }
  }
  
  const bodySizeBytes = Buffer.byteLength(event.body || '', 'utf8')
  const bodySizeMB = bodySizeBytes / (1024 * 1024)
  if (bodySizeMB > 1.5) {
    return {
      statusCode: 413,
      body: JSON.stringify({ error: 'Request body too large. Maximum 1.5MB allowed.' }),
      headers: {
        'Access-Control-Allow-Origin': deployedUrl
      }
    }
  }

  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' })
    }
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  
  if (!OPENROUTER_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    }
  }

  try {
    const { imageBase64, analysisType, context } = JSON.parse(event.body)

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image data is required' })
      }
    }

    const prompts = {
      crack: `Analyze this structural image for cracks, defects, and damage. Provide:
1. Detailed description of visible cracks/damage
2. Severity assessment (Minor/Moderate/Severe/Critical)
3. Estimated crack width range in mm
4. Type of cracking (flexural, shear, thermal, settlement)
5. Potential causes
6. Recommended actions
7. Urgency level (Low/Medium/High/Critical)
Be specific and technical, as this is for professional structural engineers.`,
      
      diagram: `Analyze this hand-drawn or digital structural diagram. Identify:
1. All structural elements (beams, columns, supports, etc.)
2. Applied loads (point loads, distributed loads, moments)
3. Support types (fixed, pinned, roller)
4. Dimensions and annotations
5. Any visible calculations or notes
Provide a detailed structural interpretation for analysis.
${context ? `\n\nAdditional context: ${context}` : ''}`
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': event.headers.referer || 'https://structuralvision-ai.netlify.app',
        'X-Title': 'StructuralVision AI'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              },
              {
                type: 'text',
                text: prompts[analysisType] || prompts.crack
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API request failed')
    }

    const data = await response.json()
    const result = data.choices[0].message.content

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': matchedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
        'Vary': 'Origin'
      },
      body: JSON.stringify({ result })
    }

  } catch (error) {
    console.error('Analysis error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Analysis failed' })
    }
  }
}
