import { GoogleGenAI } from "@google/genai";
import { RBRRow } from "../data/rbrData";

const getApiKey = () => {
  // Try platform-injected process.env (AI Studio)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // process not defined, ignore
  }

  // Try Vite environment variable (standard for Vercel/local dev)
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const analyzePSCApproval = async (selectedRoom: RBRRow, requestedKw: number) => {
  const prompt = `
You are a Wireless PSC (Power, Space, and Cooling) Capacity Planner. 
Analyze the following request based on the provided Room-by-Room (RBR) record and the "Manual Capacity Analysis" rules.

### PSC APPROVAL RULES:
1. Thresholds:
   - Green (< 70% Actual): Ample capacity, may proceed.
   - Yellow (70-80% Actual): Deep-dive review required.
   - Red (> 80% Actual): Deny or require active decom plan.
2. Reserve Rules (> 120%):
   - A. Reserve > 120% + Actual < 70% --> MAY APPROVE if request is small (usually < 2kW).
   - B. Reserve > 120% + Actual > 70% --> DENY.
   - C. Actual > 80% --> DENY, regardless of reserve.
3. Capped Rooms:
   - If room is CAPPED but actual power is available (e.g., < 80%) and reserve isn't dangerously overloaded, it can be approved with justification.

### CURRENT DATA:
- FUZE SPM Site Name: ${selectedRoom.siteName}
- IFP Room Name: ${selectedRoom.roomName}
- Requested kW: ${requestedKw}
- Room LCD (kW): ${selectedRoom.lcdKw}
- Actual Power (kW): ${selectedRoom.actualPowerKw}
- Actual Power Utilization: ${selectedRoom.actualUtilization}%
- Actual Power Remaining (kW): ${selectedRoom.actualRemainingKw}
- IFP Reserve Power (kW): ${selectedRoom.reservePowerKw}
- Reserve Power Utilization: ${selectedRoom.reserveUtilization}%
- Space Constrained (Y/N): ${selectedRoom.spaceConstrained}
- Status: ${selectedRoom.status}
- Comments: ${selectedRoom.comments}

### TASKS:
1. Provide a quick determination: ACCEPT or REJECT.
2. Provide a detailed result text matching the format shown in these examples:
   Example Format 1: "Reviewed and approved for 0.747 kW in Switch Room 100 based on Room LCD of 782 kW; Room Actual Power = 466 kW which is 60% leaving 316 kW Actual. Corrected Reserve Power = 745 kW which is 95% leaving 193 kW of Reserve. The addition of 0.747 kW will not exceed the 120% Reserve. Verified there are no active projects waiting PSR..."
   Example Format 2: "Approved even though room is listed as Capped, actual power is available at 71%. [Data specifics...]"
3. Flag any anomalies or potential risks. 
   - If the Status is "CAPPED", the first entry in your anomalies list MUST be "Room is listed as Capped." 
   - If "Space Constrained (Y/N)" is "Y", the next entry MUST be "Room is marked as Space Constrained."
4. Calculate the "Corrected Reserve Power" (Current Reserve + Requested kW).

Output in JSON format:
{
  "determination": "ACCEPT" | "REJECT" | "REVIEW REQUIRED",
  "resultText": "string",
  "anomalies": ["string"],
  "correctedReservePercent": number,
  "context": "string"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text;
    if (!text) throw new Error("Failed to generate AI response");
    
    // Clean potential markdown or extra text
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    // Robust Bracket Matching to find the exact JSON object
    const findJsonBoundaries = (str: string) => {
      const start = str.indexOf('{');
      if (start === -1) return null;
      
      let count = 0;
      for (let i = start; i < str.length; i++) {
        if (str[i] === '{') count++;
        else if (str[i] === '}') count--;
        
        if (count === 0) {
          return str.substring(start, i + 1);
        }
      }
      return null;
    };

    const cleanedText = findJsonBoundaries(text) || text;

    try {
      return JSON.parse(cleanedText);
    } catch (parseErr) {
      // Fallback: If bracket matching failed or parse failed, try last resort substring
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          return JSON.parse(text.substring(startIdx, endIdx + 1));
        } catch (e) {
          console.error("Manual JSON Fix FAILED. Raw Output:", text);
          throw parseErr;
        }
      }
      throw parseErr;
    }
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
};
