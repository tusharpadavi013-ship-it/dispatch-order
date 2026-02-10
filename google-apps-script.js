
/**
 * Google Apps Script for Ginza Industries Dispatch Tracker
 * Handles Two-Way Sync (Create, Read, Delete)
 */

const SHEET_ID = "1j7zhkwKZYAufxkwsEUBHnauqMowQ_IPaQT5sVYFpT2w";

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const data = JSON.parse(e.postData.contents);
    
    // Check if it's a DELETE action
    if (data.action === 'DELETE') {
      const idToDelete = data.id;
      const rows = sheet.getDataRange().getValues();
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0].toString() === idToDelete.toString()) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
        }
      }
      return ContentService.createTextOutput("Not Found").setMimeType(ContentService.MimeType.TEXT);
    }

    // Default: SAVE action
    // Row mapping: [ID, Date, SUR_O, SUR_D, KDC_O, KDC_D, CKU_O, CKU_D, EMB_O, EMB_D, LMN_O, LMN_D, Total_O, Total_D]
    const row = [data.id, data.date];
    const units = ["SUR", "KDC", "CKU", "EMB", "LMN"];
    
    units.forEach(function(u) {
      const unitInfo = data.units[u] || { orderValue: 0, dispatchValue: 0 };
      row.push(unitInfo.orderValue || 0);
      row.push(unitInfo.dispatchValue || 0);
    });
    
    row.push(data.totalOrder);
    row.push(data.totalDispatch);
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheets()[0];
    const rows = sheet.getDataRange().getValues();
    
    // Skip header if first row is labels
    const data = [];
    const units = ["SUR", "KDC", "CKU", "EMB", "LMN"];
    
    // Logic to parse rows back into SubmissionPayload objects
    // Assuming structure: [ID, Date, SUR_O, SUR_D, ..., Total_O, Total_D]
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // Basic check if it's a data row (ID should be a timestamp or string)
      if (!r[0] || r[0] === "ID") continue; 

      const payload = {
        id: r[0],
        date: r[1],
        units: {},
        totalOrder: r[12],
        totalDispatch: r[13]
      };
      
      let col = 2;
      units.forEach(u => {
        payload.units[u] = {
          orderValue: r[col],
          dispatchValue: r[col+1]
        };
        col += 2;
      });
      
      data.push(payload);
    }

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
