export function exportToJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToText(data, filename) {
  let text = ''
  
  if (typeof data === 'string') {
    text = data
  } else {
    text = formatDataAsText(data)
  }
  
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

function formatDataAsText(data) {
  let text = 'STRUCTURAL ANALYSIS REPORT\n'
  text += '='.repeat(50) + '\n\n'
  
  for (const [key, value] of Object.entries(data)) {
    text += `${key}: ${formatValue(value)}\n`
  }
  
  return text
}

function formatValue(value) {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return value
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    return true
  }).catch(err => {
    console.error('Failed to copy:', err)
    return false
  })
}
