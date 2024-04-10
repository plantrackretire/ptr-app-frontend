export const fetchData = async (url: string, body: any, token: string) => {
  const postResult = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
          'Authorization': token,
      }
  });
  const postResultJSON = await postResult.json();  
  return postResultJSON;      
}

export const compareObjects = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export const hexToRgb = (hex: string, opacity?: number): string => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
      "rgb(" + parseInt(result[1], 16).toString() + ", " + parseInt(result[2], 16).toString() + ", " + 
          parseInt(result[3], 16).toString() + ((opacity !== null) ? ", " + opacity?.toString() + ")" : ")")
  : "";
}

// Re-use canvas object for better performance
let canvas = document.createElement("canvas")
export function getTextWidth(text: string, font: string): number {
  if(!canvas) {
      canvas = document.createElement("canvas");
  }
  const context = canvas.getContext("2d");
  context!.font = font;
  const metrics = context!.measureText(text);
  return metrics.width;
}

// Re-use formatter for better performance
const balanceFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, style: 'currency', currency: 'USD' });
export const formatBalance = (balance: number): string => {
  return balanceFormatter.format(balance);
}

// Re-use formatter for better performance
const priceFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
export const formatPrice = (price: number): string => {
  return priceFormatter.format(price);
}

// Re-use formatter for better performance
const changePercentageFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1, style: 'percent' });
export const formatChangePercentage = (percent: number): string => {
  return changePercentageFormatter.format(percent);
}

// Re-use formatter for better performance
const quantityFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatQuantity = (quantity: number): string => {
  return quantityFormatter.format(quantity);
}
