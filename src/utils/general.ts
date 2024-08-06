import { fetchAuthSession } from "@aws-amplify/auth";
import { ModalContextType, ModalType } from "../providers/Modal";


export const fetchData = async (url: string, body: any, token: string) => {
  let postResult = null;
  try {
    postResult = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
          'Authorization': token,
      }
    });

    const postResultJSON = await postResult.json();
    return postResultJSON;      
  } catch(err) {
    // TODO: Throw exception?
    console.log("Failed fetching data for " + url);
    console.log(body);
    console.log(err);
  }

  return null;
}

export const getUserToken = async (signOut: (() => void), modalContext: ModalContextType) => {
  let jwtToken = '';
  try {
    jwtToken = (await fetchAuthSession()).tokens?.idToken?.toString() as string;
  } catch (err) {
    // TODO: Throw exception?
    console.log("Error getting token");
    console.log(err);
    await modalContext.showModal(
      ModalType.confirm,
      'Error loading user session, please login again.',
    );
    signOut();
  }

  if(!jwtToken || jwtToken.length <= 0) {
    await modalContext.showModal(
      ModalType.confirm,
      'Session has expired, Please login again.',
    );
    signOut();
  }

  return jwtToken;
};

export function timeout(delay: number) {
  return new Promise( res => setTimeout(res, delay) );
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
export function getTextWidth(text: string, font: string): [number, number] {
  if(!canvas) {
      canvas = document.createElement("canvas");
  }
  const context = canvas.getContext("2d");
  context!.font = font;
  const metrics = context!.measureText(text);
  return [metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent];
}

// Re-use formatter for better performance
const balanceFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
export const formatBalance = (balance: number): string => {
  return balanceFormatter.format(balance);
}

// Re-use formatter for better performance
const balanceWithoutCentsFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0, style: 'currency', currency: 'USD' });
export const formatBalanceWithoutCents = (balance: number): string => {
  return balanceWithoutCentsFormatter.format(balance);
}

// Re-use formatter for better performance
const priceFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
export const formatPrice = (price: number): string => {
  return priceFormatter.format(price);
}

export const invalidValue: number = 0.000001234567890;
export const formatAnnotatedChangePercentage = (percent: number): string => {
  let formattedData = '';

  if(percent == invalidValue) {
    formattedData = "Not Available";
  } else {
    switch(true) {
      case percent > 0: 
        formattedData = "▲ " + formatChangePercentage(percent); break;
      case percent < 0: 
        formattedData = "▼ " + formatChangePercentage(percent); break;
      default:
        formattedData = formatChangePercentage(percent); break;
    }
  }

  return formattedData;
}

export const formatAnnotatedValue = (value: number): string => {
  let formattedData = '';

  if(value == invalidValue) {
    formattedData = "Not Available";
  } else {
    switch(true) {
      case value > 0: 
        formattedData = "▲ " + formatBalanceWithoutCents(value); break;
      case value < 0: 
        formattedData = "▼ " + formatBalanceWithoutCents(value); break;
      default:
        formattedData = formatBalanceWithoutCents(value); break;
    }
  }

  return formattedData;
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

export const convertStringToArray = (inputString: string, delimeter: string, outputType: (value: string, index: number, array: string[]) => void): any[] => {
  return inputString.split(delimeter).map(outputType);
}

export const convertArrayToString = (inputArray: any[], delimeter: string): string => {
  let outputString = '';

  inputArray.forEach((el, index) => {
    outputString += (index > 0) ? delimeter + el : el;
  });

  return outputString;
}