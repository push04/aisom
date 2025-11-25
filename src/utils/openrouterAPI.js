export async function analyzeStructuralImage(imageBase64, analysisType = 'crack') {
  try {
    const response = await fetch('/.netlify/functions/analyze-structure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        analysisType,
        context: ''
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error('Analysis error:', error)
    throw error
  }
}

export async function analyzeStructuralDiagram(imageBase64, context = '') {
  try {
    const response = await fetch('/.netlify/functions/analyze-structure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        analysisType: 'diagram',
        context
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error('Analysis error:', error)
    throw error
  }
}
