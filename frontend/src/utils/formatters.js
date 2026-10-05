/**
 * BudgetBuddy Shared Utility Formatters
 */

// Format currency to Indian numbering system: ₹11,300.00, -₹9,701.01, +₹10,000.00
export function formatCurrency(amount, showSign = false) {
  const numericAmount = Number(amount) || 0;
  const absVal = Math.abs(numericAmount);
  
  // Convert to Indian currency string
  const formattedStr = absVal.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (numericAmount < 0) {
    return `-₹${formattedStr}`;
  } else if (numericAmount > 0 && showSign) {
    return `+₹${formattedStr}`;
  }
  return `₹${formattedStr}`;
}

// Compact currency for chart axes: ₹5.5K, ₹11K, ₹22K
export function formatCompactCurrency(amount) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${sign}₹${abs}`;
}

// Format date: "26 Sep 2026"
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Format date and time: "30 Sep 2026, 2:35 PM"
export function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const datePart = formatDate(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  return `${datePart}, ${hours}:${minutes} ${ampm}`;
}

// Format month label: "Sep 2026"
export function formatMonthYear(monthStr, yearStr) {
  if (!monthStr) return "";
  const monthNames = {
    "01": "Jan", "1": "Jan", "Jan": "Jan", "January": "Jan",
    "02": "Feb", "2": "Feb", "Feb": "Feb", "February": "Feb",
    "03": "Mar", "3": "Mar", "Mar": "Mar", "March": "Mar",
    "04": "Apr", "4": "Apr", "Apr": "Apr", "April": "Apr",
    "05": "May", "5": "May", "May": "May",
    "06": "Jun", "6": "Jun", "Jun": "Jun", "June": "Jun",
    "07": "Jul", "7": "Jul", "Jul": "Jul", "July": "Jul",
    "08": "Aug", "8": "Aug", "Aug": "Aug", "August": "Aug",
    "09": "Sep", "9": "Sep", "Sep": "Sep", "September": "Sep",
    "10": "Oct", "Oct": "Oct", "October": "Oct",
    "11": "Nov", "Nov": "Nov", "November": "Nov",
    "12": "Dec", "Dec": "Dec", "December": "Dec",
  };
  const m = monthNames[monthStr] || monthStr;
  return yearStr ? `${m} ${yearStr}` : m;
}

// Format full month name: "September 2026" from "2026-09" or "Sep 2026"
export function formatFullMonthYear(monthCode) {
  if (!monthCode) return "";
  if (monthCode.includes("-")) {
    const [year, month] = monthCode.split("-");
    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${fullMonths[mIdx]} ${year}`;
    }
  }
  return monthCode;
}
