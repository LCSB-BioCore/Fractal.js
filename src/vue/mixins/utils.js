/**
 * https://stackoverflow.com/questions/5723154/truncate-a-string-in-the-middle-with-javascript
 */
export function truncate ({text, strLen, separator}) {
  if (text.length <= strLen) return text

  separator = separator || '...'

  const sepLen = separator.length
  const charsToShow = strLen - sepLen
  const frontChars = Math.ceil(charsToShow / 2)
  const backChars = Math.floor(charsToShow / 2)

  return text.substr(0, frontChars) + separator + text.substr(text.length - backChars)
}

/**
 * https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript
 */
export function getTextWidth ({text, font}) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))
  const context = canvas.getContext('2d')
  context.font = font
  const metrics = context.measureText(text)
  return metrics.width
}

export function truncateTextUntil ({text, font, maxWidth}) {
  while (getTextWidth({text, font}) > maxWidth) {
    text = truncate({text, strLen: text.length - 5})
  }
  return text
}
