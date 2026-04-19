export interface RBRRow {
  clli8: string;
  mdgCode: string;
  siteName: string;
  locationName: string;
  type: string;
  roomName: string;
  roomId: string;
  planner: string;
  squareFootage: string;
  status: string;
  supportingPlant: string;
  powerType: string;
  dcAmperage: string;
  powerCapacityKw: number;
  coolingCapacityKw: number;
  limitingSystem: string;
  lcdKw: number;
  actualPowerKw: number;
  actualUtilization: number;
  actualRemainingKw: number;
  reservePowerKw: number;
  reserveUtilization: number;
  reserveBalance120: number;
  spaceConstrained: string;
  comments: string;
  implementer: string;
  region: string;
}

// Helper to create a basic entry for the 147 unique sites
const createSummaryEntry = (site: string): RBRRow => ({
  clli8: "N/A",
  mdgCode: "N/A",
  siteName: site,
  locationName: site.replace("MSC ", ""),
  type: "SUMMARY",
  roomName: "Site Summary",
  roomId: "SUMMARY",
  planner: "TBD",
  squareFootage: "0",
  status: "AVAILABLE",
  supportingPlant: "SUMMARY",
  powerType: "N/A",
  dcAmperage: "N/A",
  powerCapacityKw: 0,
  coolingCapacityKw: 0,
  limitingSystem: "N/A",
  lcdKw: 0,
  actualPowerKw: 0,
  actualUtilization: 0,
  actualRemainingKw: 0,
  reservePowerKw: 0,
  reserveUtilization: 0,
  reserveBalance120: 0,
  spaceConstrained: "N",
  comments: "Awaiting detailed room breakdown",
  implementer: "TBD",
  region: "NATIONAL"
});

const mscSiteList = [
  "MSC ROCKLIN", "MSC SUNNYVALE", "MSC VISTA", "MSC AZUSA", "MSC ONTARIO", "MSC MARINA", "MSC TUSTIN", 
  "MSC SAN DIEGO", "MSC FRESNO", "MSC SANTA CLARA", "MSC BAKERSFIELD", "MSC FAIRFIELD", "MSC PLEASANTON", 
  "MSC STOCKTON", "MSC SANTA ANA", "MSC LOS ANGELES", "MSC AKRON", "MSC BRIDGEVILLE", "MSC BUFFALO", 
  "MSC CLEVELAND", "MSC COLUMBUS", "MSC CINCINNATI", "MSC GUION", "MSC HARRISBURG", "MSC JOHNSTOWN", 
  "MSC SOUTHFIELD 4", "MSC LEWIS CENTER", "MSC SOUTHFIELD 5", "MSC MAUMEE", "MSC TROY", "MSC PLAINFIELD", 
  "MSC ROCHESTER", "MSC ROYAL OAK", "MSC ST CLAIRSVILLE", "MSC EAST SYRACUSE", "MSC WALLINGFORD", 
  "MSC WESTLAND", "MSC WESTSIDE", "MSC WINDSOR", "MSC YONKERS", "MSC WHITESTONE", "MSC WESTBOROUGH", 
  "MSC ROSLINDALE", "MSC WEST NYACK", "MSC WAYNE", "MSC WALL", "MSC TAUNTON", "MSC PITTSTON", 
  "MSC MINEOLA", "MSC JERSEY CITY", "MSC HOOKSET", "MSC FARMINGDALE", "MSC BRANCHBURG 3", "MSC BRANCHBURG", 
  "MSC BILLERICA", "MSC NY CITY", "MSC ADELPHI", "MSC CHARLOTTE", "MSC WHITES CREEK", "MSC PEMBROKE PINES", 
  "MSC ORLANDO", "MSC ALPHARETTA", "MSC BIRMINGHAM", "MSC ANNAPOLIS JUNCTION", "MSC CHANTILLY", 
  "MSC RICHMOND - SHOCKOE", "MSC THIRLANE", "MSC PLYMOUTH MTG", "MSC NEW CASTLE", "MSC CHANDLER", 
  "MSC KNOXVILLE", "MSC RALEIGH - HAMMOND", "MSC RALEIGH-JUNCTION", "MSC MT LAUREL", "MSC JACKSONVILLE", 
  "MSC JUPITER", "MSC MACON", "MSC PLANT CITY", "MSC COLUMBIA", "MSC GREENVILLE", "MSC WOODLAWN", 
  "MSC LOUISVILLE", "MSC CHARLESTON", "MSC GREENSBORO", "MSC PHILADELPHIA", "MSC NEWPORT NEWS", 
  "MSC GOODESBRIDGE", "MSC SALISBURY", "MSC DULUTH", "MSC APPLETON", "MSC DES MOINES", "MSC AURORA", 
  "MSC BOISE", "MSC BLOOMINGTON", "MSC CARBONDALE", "MSC ENGLEWOOD", "MSC DARDENNE", "MSC ELGIN", 
  "MSC FARGO", "MSC GOLDEN VALLEY", "MSC HELENA", "MSC HICKORY HILLS", "MSC SALT LAKE CITY", "MSC LENEXA", 
  "MSC MISHAWAKA", "MSC MOUND RIDGE", "MSC NEW BERLIN", "MSC OWATONNA", "MSC PEORIA", "MSC ROCKFORD", 
  "MSC SIOUX FALLS", "MSC SPRINGFIELD", "MSC SPRINGFIELD NNO - 40382", "MSC ST LOUIS 1", "MSC WEST JORDAN", 
  "MSC WESTMINSTER", "MSC WEST OMAHA", "MSC ALBUQUERQUE", "MSC ANCHORAGE", "MSC BATON ROUGE", "MSC BELMONT", 
  "MSC HOUSTON", "MSC COVINGTON", "MSC EULESS", "MSC EL PASO OSBORNE", "MSC EUGENE", "MSC GILBERT", 
  "MSC HILLSBORO", "MSC LAS VEGAS", "MSC LITTLE ROCK", "MSC LUBBOCK", "MSC ARLINGTON", "MSC MILILANI", 
  "MSC SEATTLE", "MSC PENSACOLA", "MSC PHOENIX", "MSC REDMOND", "MSC SCHERTZ", "MSC SHREVEPORT", 
  "MSC SPOKANE", "MSC TACOMA", "MSC TEMPE", "MSC TUCSON", "MSC TULSA", "MSC NORTH MECKLENBURG", "MSC ROSWELL 1"
];

// Combine existing detailed data with the summary placeholders for the remaining sites
export const rbrData: RBRRow[] = [
  {
    clli8: "RCKLCAIG",
    mdgCode: "5000095810",
    siteName: "MSC ROCKLIN",
    locationName: "Rocklin",
    type: "SAP",
    roomName: "MSC-Rocklin SUMMARY",
    roomId: "SUMMARY",
    planner: "Alo, Lehi",
    squareFootage: "42978",
    status: "AVAILABLE",
    supportingPlant: "SUMMARY",
    powerType: "DC & AC",
    dcAmperage: "N/A",
    powerCapacityKw: 1181,
    coolingCapacityKw: 1397,
    limitingSystem: "POWER",
    lcdKw: 1181,
    actualPowerKw: 592,
    actualUtilization: 50,
    actualRemainingKw: 589,
    reservePowerKw: 1188,
    reserveUtilization: 101,
    reserveBalance120: 230,
    spaceConstrained: "N",
    comments: "Update 04/15/26 Pending NNO ouster",
    implementer: "Fernando Cabello",
    region: "WEST"
  },
  {
    clli8: "ALBQNMMF",
    mdgCode: "5000276277.01",
    siteName: "MSC ALBUQUERQUE",
    locationName: "Albuquerque",
    type: "TAP",
    roomName: "Switch 101",
    roomId: "101",
    planner: "Alo, Lehi",
    squareFootage: "1200",
    status: "AVAILABLE",
    supportingPlant: "DC Plant A",
    powerType: "DC",
    dcAmperage: "N/A",
    powerCapacityKw: 144,
    coolingCapacityKw: 150,
    limitingSystem: "POWER",
    lcdKw: 144,
    actualPowerKw: 26,
    actualUtilization: 18,
    actualRemainingKw: 118,
    reservePowerKw: 153,
    reserveUtilization: 106,
    reserveBalance120: 20,
    spaceConstrained: "N",
    comments: "",
    implementer: "Fernando Cabello",
    region: "WEST"
  },
  {
    clli8: "ALBQNMMF",
    mdgCode: "5000276277.03",
    siteName: "MSC ALBUQUERQUE",
    locationName: "Albuquerque",
    type: "TAP",
    roomName: "Network 103",
    roomId: "337",
    planner: "Alo, Lehi",
    squareFootage: "1840",
    status: "AVAILABLE",
    supportingPlant: "DC Plant A",
    powerType: "DC",
    dcAmperage: "N/A",
    powerCapacityKw: 80,
    coolingCapacityKw: 45,
    limitingSystem: "COOLING",
    lcdKw: 40,
    actualPowerKw: 34,
    actualUtilization: 86,
    actualRemainingKw: 6,
    reservePowerKw: 44,
    reserveUtilization: 109,
    reserveBalance120: 4,
    spaceConstrained: "N",
    comments: "",
    implementer: "Fernando Cabello",
    region: "WEST"
  },
  {
    clli8: "ALBQNMMF",
    mdgCode: "5000276277.08",
    siteName: "MSC ALBUQUERQUE",
    locationName: "Albuquerque",
    type: "TAP",
    roomName: "Cell Room 1 108",
    roomId: "108",
    planner: "Alo, Lehi",
    squareFootage: "1100",
    status: "AVAILABLE",
    supportingPlant: "DC Plant A",
    powerType: "DC",
    dcAmperage: "N/A",
    powerCapacityKw: 60,
    coolingCapacityKw: 40,
    limitingSystem: "COOLING",
    lcdKw: 40,
    actualPowerKw: 12,
    actualUtilization: 30,
    actualRemainingKw: 28,
    reservePowerKw: 20,
    reserveUtilization: 50,
    reserveBalance120: 28,
    spaceConstrained: "N",
    comments: "",
    implementer: "Fernando Cabello",
    region: "WEST"
  },
  {
    clli8: "ALBQNMMF",
    mdgCode: "5000276277.XX",
    siteName: "MSC ALBUQUERQUE",
    locationName: "Albuquerque",
    type: "PLANT",
    roomName: "DC Plant A 107 & 106",
    roomId: "PLANT", // Non-numerical value
    planner: "Alo, Lehi",
    squareFootage: "500",
    status: "AVAILABLE",
    supportingPlant: "N/A",
    powerType: "N/A",
    dcAmperage: "N/A",
    powerCapacityKw: 0,
    coolingCapacityKw: 0,
    limitingSystem: "N/A",
    lcdKw: 0,
    actualPowerKw: 0,
    actualUtilization: 0,
    actualRemainingKw: 0,
    reservePowerKw: 0,
    reserveUtilization: 0,
    reserveBalance120: 0,
    spaceConstrained: "N",
    comments: "Should be filtered out",
    implementer: "Fernando Cabello",
    region: "WEST"
  },
  {
    clli8: "SFLDMILR",
    mdgCode: "5000189402",
    siteName: "MSC SOUTHFIELD 5",
    locationName: "Lodge",
    type: "SAP",
    roomName: "Network Room (221)",
    roomId: "2330",
    planner: "Haas, Charles",
    squareFootage: "7239",
    status: "AVAILABLE",
    supportingPlant: "UPS A & B",
    powerType: "AC",
    dcAmperage: "N/A",
    powerCapacityKw: 1440,
    coolingCapacityKw: 1596,
    limitingSystem: "POWER",
    lcdKw: 1440,
    actualPowerKw: 22,
    actualUtilization: 2,
    actualRemainingKw: 1418,
    reservePowerKw: 325,
    reserveUtilization: 23,
    reserveBalance120: 1403,
    spaceConstrained: "N",
    comments: "",
    implementer: "Andrew Pachmayer",
    region: "WEST"
  },
  ...mscSiteList
    .filter(site => !["MSC ROCKLIN", "MSC ALBUQUERQUE", "MSC SOUTHFIELD 5"].includes(site))
    .map(site => createSummaryEntry(site))
];
