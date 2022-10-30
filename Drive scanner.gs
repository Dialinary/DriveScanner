const HEADERS = [
  "Stored in",
  "File Name",
  "Last update",
  "Size",
  "is trashed",
  "URL",
  "Id",
  "Mimetype",
  "Folder id",
  "Folder URL",
];
const DRIVEMAPALL = {};
const FOLDERSTOSCANLIST = [];
const COMPLETEPATHS = [];

/**
 * Specific folder scan hub
 * This function will launch all necessary functions to scan a specific folder
 * @param {string} folderId
 * @param {string} folderName
 */
function letsScanThisFolderAndItsSubfolder(folderId, folderName) {
  // Let's build the Drive map to retrieve the subfolders if any
  buildCompleteDriveMap();
  // Now let's list all the folders we will need to scan
  const root = {};
  root[folderId] = DRIVEMAPALL[folderId];
  FOLDERSTOSCANLIST.push(root);
  listSubFolders(folderId);
  // Now that we have the list, we can build the query that will filter our research
  q = generateTheQueryToScanThisFolder();
  // We can now run the scan
  scanThisFolder(q, folderName, folderId);
}

/**
 * Scan hub
 * This function will launch all necessary functions to scan the entire drive
 */
function letsScanTheEntireDrive() {
  // Let's build the Drive map to retrieve the subfolders if any
  buildCompleteDriveMap();
  // Now that we have the list, we can build the query that will filter our research
  q = "mimeType!='application/vnd.google-apps.folder'";
  // We can now run the scan
  scanThisFolder(q, "All Drive", "");
}

/**
 * List and fill Drive Map for every folder
 * @param {string} id
 * @param {string} name
 */
function buildCompleteDriveMap() {
  try {
    let pageToken;
    let items = [];
    do {
      folders = Drive.Files.list({
        corpora: "allDrives",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        q: "mimeType='application/vnd.google-apps.folder'",
        pageToken: pageToken,
      });

      if (folders.items && folders.items.length > 0) items = items.concat(folders.items);
      pageToken = folders.nextPageToken;
    } while (pageToken);
    for (let i = 0; i < items.length; i++) {
      if (items[i].id && items[i].title) {
        DRIVEMAPALL[items[i].id] = {};
        DRIVEMAPALL[items[i].id]["title"] = items[i].title;
        DRIVEMAPALL[items[i].id]["parent"] = items[i].parents[0] ? items[i].parents[0].id : "None";
      }
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * Search for subfolders and fill the list of folders to scan
 * @param {string} parentId
 */
function listSubFolders(parentId) {
  for (const fold in DRIVEMAPALL) {
    if (DRIVEMAPALL[fold]["parent"]) {
      if (DRIVEMAPALL[fold]["parent"] == parentId) {
        child = {};
        child[fold] = DRIVEMAPALL[fold];
        FOLDERSTOSCANLIST.push(child);
        listSubFolders(fold);
      }
    } else {
      console.log("parent not found for " + DRIVEMAPALL[parentId]);
    }
  }
}

/**
 * Retreive the entire path for a given file
 * This function isn't called so far, cause the execution time is exponentially increasing
 * But I'll keep it in this project in case the fp considers this info worths the execution time.
 * @param {string} childId
 * @param {string} path
 * @return {array} path
 */
function findEntirePathIfThisFolder(childId, path) {
  for (const fold in DRIVEMAPALL) {
    if (DRIVEMAPALL[childId]) {
      if (DRIVEMAPALL[childId]["parent"] == fold) {
        path.push(DRIVEMAPALL[fold]["title"]);
        findEntirePathIfThisFolder(fold, path);
      }
    } else {
      console.log("parent not found for " + DRIVEMAPALL[childId]);
    }
  }
  return path;
}

/**
 * Prepare the query regarding the folders to scan
 * @return {string} q
 */
function generateTheQueryToScanThisFolder() {
  // listSubFolders(id);
  let q = "(";
  for (let i = 0; i < FOLDERSTOSCANLIST.length - 1; i++) {
    q += "'" + Object.keys(FOLDERSTOSCANLIST[i])[0] + "' in parents or ";
  }
  q +=
    "'" +
    Object.keys(FOLDERSTOSCANLIST[FOLDERSTOSCANLIST.length - 1])[0] +
    "' in parents) and mimeType != 'application/vnd.google-apps.folder'";
  console.log(q);
  // scanThisFolder(q, rootName, root[id]);
  return q;
}

/**
 * Scan a specific folder
 * @param {string} q
 * @param {string} rootName
 * @param {string} rootId
 */
function scanThisFolder(q, rootName, rootId) {
  try {
    let pageToken;
    let items = [];
    do {
      files = Drive.Files.list({
        corpora: "allDrives",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        q: q,
        pageToken: pageToken,
      });

      if (files.items && files.items.length > 0) items = items.concat(files.items);
      pageToken = files.nextPageToken;
    } while (pageToken);

    const FILES = [];
    for (let i = 0; i < items.length; i++) {
      const folderName =
        items[i].parents[0] && DRIVEMAPALL[items[i].parents[0].id]
          ? DRIVEMAPALL[items[i].parents[0].id]["title"]
          : "Unknown";
      const folderId = items[i].parents[0] ? items[i].parents[0].id : "Unknown";
      const folderLink =
        folderId != "Unknown" ? "https://drive.google.com.rproxy.goskope.com/drive/u/0/folders/" + folderId : "Unknown";

      // This part allows to get the entire path for each file
      // But due to the execution time exponentially raising with that field, I'll let it as a comment for now
      // if (folderId != 'Unknown') {
      //   let path = [];
      //   let entirepathlist = findEntirePathIfThisFolder(items[i].id, path);
      //   entirepathlist = entirepathlist.reverse();
      //   entirepath = entirepathlist[0];
      //   for (var i = 1; i < entirepathlist.length; i++) {
      //     entirepath = " > " + entirepathlist[i]
      //   }
      // } else {
      //   entirepath = "Path not found"
      // }

      const newRow = [
        folderName,
        items[i].title,
        items[i].modifiedDate,
        items[i].fileSize,
        items[i].explicitlyTrashed,
        items[i].embedLink,
        items[i].id,
        items[i].mimeType,
        folderId,
        folderLink,
      ];
      FILES.push(newRow);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Careful a spreadsheet can't have several sheets with the same name
    // if it happens, the second folder scanned sheet will be named: name + folderId to avoid any confusion

    const sheetsNames = [];
    ss.getSheets().forEach((sheet) => sheetsNames.push(sheet.getName()));
    let sheet;

    // Case: folder scan, the name folder hasn't been scanned or is not in the ss anymore
    if (!sheetsNames.includes(rootName, 0) && q != "mimeType!='application/vnd.google-apps.folder'") {
      sheet = ss.insertSheet().setName(rootName);
    }
    // Case: folder scan, a tab already exists, add the folder id to differentiate the tabs / folders
    else if (sheetsNames.includes(rootName, 0) && q != "mimeType!='application/vnd.google-apps.folder'") {
      rootName = rootName + " (" + rootId + ")";
      sheet = ss.insertSheet().setName(rootName);
    } 
    // Case: Complete scan, check if a tab All Drive + today's date already exists
    else if (rootName == 'All Drive' && !sheetsNames.includes(rootName + ' ' + new Date().toLocaleDateString(), 0)) {
      sheet = ss.insertSheet().setName(rootName + ' ' + new Date().toLocaleDateString());
    } 
    // Case: Complete scan, check if a scan has already been made today and get this sheet if so
    else if (rootName == 'All Drive' && sheetsNames.includes(rootName + ' ' + new Date().toLocaleDateString(), 0)) {
      sheet = ss.getSheetByName(rootName + ' ' + new Date().toLocaleDateString());
    } 

    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(2, 1, FILES.length, FILES[0].length).setValues(FILES);
  } catch (e) {
    console.log(e);
  }
}
