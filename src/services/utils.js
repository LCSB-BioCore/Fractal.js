export default {
  /**
   * https://stackoverflow.com/questions/5723154/truncate-a-string-in-the-middle-with-javascript
   */
  truncate ({fullStr, strLen, separator}) {
    if (fullStr.length <= strLen) return fullStr

    separator = separator || '...'

    const sepLen = separator.length
    const charsToShow = strLen - sepLen
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)

    return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars)
  }
}
