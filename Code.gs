/**
 * Adds the menu Drive Scanner when the spreadsheet is opened
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Drive Scanner")
    .addItem("Start", "showHome")
    .addToUi();
}

/**
 * Displays the "Home" dialog, allowing to scan all the Drive or open the folder picker
 */
function showHome() {
  var html = HtmlService.createHtmlOutputFromFile("Home.html")
    .setWidth(300)
    .setHeight(212)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(html, "Drive scanner");
}

/**
 * Displays the folder picker dialog
 */
function showPicker() {
  var html = HtmlService.createHtmlOutputFromFile("folderPicker.html")
    .setWidth(650)
    .setHeight(500)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi().showModalDialog(html, "Select Folder");
}

/**
 * Displays the folder picker dialog
 * @return {string}
 */
function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
}
