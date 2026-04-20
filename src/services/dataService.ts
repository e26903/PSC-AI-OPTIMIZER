import Papa from 'papaparse';
import { RBRRow } from '../data/rbrData';

export interface DataFetchResult {
  data: RBRRow[];
  timestamp: string;
  source: 'remote' | 'local';
}

export const mapCsvToRBRRows = (data: any[]): RBRRow[] => {
  return data.map((row: any) => {
    // Re-introducing controlled header matching for robustness
    const getVal = (aliases: string[], columnIndex?: number) => {
      const keys = Object.keys(row);
      
      // 1. Try aliases first
      const foundKey = keys.find(k => {
        const normalizedK = k.toLowerCase().replace(/[\s_\-]/g, '');
        return aliases.some(a => a.toLowerCase() === normalizedK);
      });
      
      if (foundKey) return row[foundKey];

      // 2. Optional Fallback: Use index if aliases fail (e.g. Column C = index 2)
      if (columnIndex !== undefined && keys[columnIndex]) {
        return row[keys[columnIndex]];
      }

      return undefined;
    };

    const parseNum = (val: any): number => {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return val;
      // Remove %, commas, and spaces.
      const clean = val.toString().replace(/[%,\s]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    return {
      clli8: getVal(['clli8', 'clli'], 0) || '',
      mdgCode: getVal(['mdgCode', 'mdg', 'mdgcode'], 1) || '',
      siteName: getVal(['fuzespmsitename', 'siteName', 'site', 'sitename', 'msc', 'mcs', 'mcssitename', 'mscsitename', 'locationname', 'sitename', 'sitenamealiases'], 2) || '',
      locationName: getVal(['locationName', 'location', 'city', 'sitecity'], 3) || '',
      type: getVal(['type', 'sitetype', 'classification', 'siteclassification'], 4) || '',
      roomName: getVal(['ifproomname', 'roomName', 'room', 'roomid', 'roomname'], 5) || '',
      roomId: getVal(['roomId', 'room_id', 'id', 'roomcode'], 6) || '',
      planner: getVal(['planner', 'engineer', 'plannername'], 7) || '',
      squareFootage: (getVal(['squareFootage', 'sqft', 'squarefeet', 'roomsqft', 'squarefootage'], 8) || '').toString(),
      status: getVal(['status', 'state', 'roomstatus'], 9) || '',
      supportingPlant: getVal(['supportingPlant', 'plant', 'supportingplant', 'planttype'], 10) || '',
      powerType: getVal(['powerType', 'powertype', 'power', 'powertypename'], 11) || '',
      dcAmperage: (getVal(['dcAmperage', 'amperage', 'dcamps', 'roomdcamps'], 12) || '').toString(),
      powerCapacityKw: parseNum(getVal(['powerCapacityKw', 'powercapacity', 'powercap', 'roompowercapacity'], 13)),
      coolingCapacityKw: parseNum(getVal(['coolingCapacityKw', 'coolingcapacity', 'coolingcap', 'roomcoolingcapacity'], 14)),
      limitingSystem: getVal(['limitingSystem', 'limitingsystem', 'bottleneck', 'limitingequipment'], 15) || '',
      lcdKw: parseNum(getVal(['lcdKw', 'lcd', 'lcdkw', 'roomlcd', 'cllcd'], 16)),
      actualPowerKw: parseNum(getVal(['actualPowerKw', 'actualpower', 'actualload', 'roomactualpower'], 17)),
      actualUtilization: parseNum(getVal(['actualpowerutilizationoflcd', 'actualUtilization', 'actualutil', 'actualutilization', 'roomutilization'], 18)),
      actualRemainingKw: parseNum(getVal(['actualRemainingKw', 'remainingkw', 'remainingpower', 'roomremainingpower'], 19)),
      reservePowerKw: parseNum(getVal(['reservePowerKw', 'reservepower', 'reservekw', 'roomreservepower'], 20)),
      reserveUtilization: parseNum(getVal(['reservepowerutilizationoflcd', 'reserveUtilization', 'reserveutil', 'reserveutilization'], 21)),
      reserveBalance120: parseNum(getVal(['reserveBalance120', 'balance120', 'reservebalance'], 22)),
      spaceConstrained: getVal(['spaceconstrainedyn', 'spaceConstrained', 'spaceconstrained', 'constrained'], 23) || '',
      comments: getVal(['comments', 'notes', 'remarks'], 24) || '',
      implementer: getVal(['implementer', 'projectmanager'], 25) || '',
      region: getVal(['region', 'area', 'territory'], 26) || '',
    };
  }) as RBRRow[];
};

export const fetchGoogleSheetData = async (sheetUrl: string): Promise<RBRRow[]> => {
  try {
    const proxyUrl = `/api/proxy-sheet?url=${encodeURIComponent(sheetUrl)}`;
    
    let csvData = "";
    try {
      // 1. Try internal proxy first (works in AI Studio and local Node)
      const proxyResponse = await fetch(proxyUrl);
      if (proxyResponse.ok) {
        csvData = await proxyResponse.text();
      } else {
        throw new Error("Proxy failed");
      }
    } catch (proxyError) {
      // 2. Fallback to direct fetch (works for "Published to Web" sheets on Vercel)
      let fetchUrl = sheetUrl;
      if (sheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }
      
      const directResponse = await fetch(fetchUrl);
      if (!directResponse.ok) {
        throw new Error(`Google Sheets responded with ${directResponse.status}: ${directResponse.statusText}`);
      }
      csvData = await directResponse.text();
    }

    if (!csvData) throw new Error("No data received from sheet");

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = mapCsvToRBRRows(results.data);
          resolve(rows);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
};
