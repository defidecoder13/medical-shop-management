const parseExpiryDate = (expiryInput) => {
  if (!expiryInput) return "";
  
  const numericVal = Number(expiryInput);
  if (!isNaN(numericVal) && numericVal > 20000 && numericVal < 100000) {
    const date = new Date(Math.round((numericVal - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  const expiryStr = String(expiryInput).trim();
  
  const alphaMatch = expiryStr.match(/^([a-zA-Z]{3})[-/\s](\d{2,4})$/);
  if (alphaMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthStr = alphaMatch[1].toLowerCase();
    const monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex !== -1) {
      const month = monthIndex + 1;
      let year = parseInt(alphaMatch[2], 10);
      if (year < 100) year += 2000;
      
      const lastDay = new Date(year, month, 0);
      const yyyy = lastDay.getFullYear();
      const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
      const dd = String(lastDay.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const cleanStr = expiryStr.replace(/[-.]/g, "/");
  const match = cleanStr.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);
    
    if (month < 1 || month > 12) return expiryStr; // Skip throw, return raw
    if (year < 100) year += 2000;
    
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
  if (/^\d{4}-\d{2}-\d{2}T/.test(cleanStr)) return cleanStr.slice(0, 10);
  
  return expiryStr;
};

const inputs = ["45231", 45231, "Sep-27", "Sep-2027", "09/27", "9/27/27", "Sep 27", "09/2027", "Sep-27 ", " Jan-28 "];
inputs.forEach(input => {
    console.log(`Input: '${input}' -> Output: '${parseExpiryDate(input)}'`);
});
