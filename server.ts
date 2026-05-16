import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  // API route to identify a tile from an image
  app.post("/api/identify-tile", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API key is missing" });
    }

    try {
      const { imageBase64 } = req.body; // e.g. "data:image/jpeg;base64,/9j/..."
      if (!imageBase64) {
         return res.status(400).json({ error: "No image provided" });
      }

      // Remove the prefix "data:image/jpeg;base64,"
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];

      const prompt = `Du bist ein Experte für das Brettspiel "Ra" von Reiner Knizia (Edition von DiceTree Games 2022).
Ein Spieler hat ein Plättchen gezogen und rechts an die Plättchenleiste angelegt. Das Foto zeigt einen Ausschnitt der Leiste.
WICHTIG: Wenn auf dem Bild mehrere Plättchen in einer Reihe nebeneinander liegen, identifiziere NUR das GANZ RECHTE Plättchen (das zuletzt gezogene, am weitesten rechts liegende). Ignoriere alle Plättchen links davon!
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Verwende exakt diese Werte für "type":
- "RA", "GOD", "PHARAOH", "BURIAL", "NILE", "FLOOD", "DROUGHT", "CIVILIZATION", "UNREST", "GOLD", "MONUMENT", "EARTHQUAKE"

Falls type "CIVILIZATION" oder "MONUMENT" ist, MUSS auch ein "subtype" angegeben werden, basierend auf dem Artwork:
- CIVILIZATION subtypes: 
  - "Landwirtschaft" (Ochse mit Pflug), 
  - "Künste" (Person malt Männchen an Wand), 
  - "Astronomie" (Person blickt nachts in Sternenhimmel), 
  - "Religion" (Person in weiß betend vor Altar), 
  - "Schrift" (Schreiber sitzt auf Boden).
- MONUMENT subtypes: 
  - "Pyramide" (eine große, glatte Pyramide), 
  - "Festung" (kleines Gebäude mit Zinnen/Mauern), 
  - "Statuen" (zwei riesige sitzende Pharaonen-Statuen), 
  - "Tempel" (Gebäude mit dicken massiven Säulen), 
  - "Obelisk" (hohe, spitze Steinsäule), 
  - "Sphinx" (Sphinx-Statue), 
  - "Palast" (großes, breites Gebäude), 
  - "Stufenpyramide" (Pyramide mit Stufen).

Spezifische Bildmerkmale für die anderen Typen (wie in der Spielregel abgebildet):
- "RA": Falke/Horus vor einer großen roten Sonnenscheibe.
- "GOD": Einzelne ägyptische Gottheit (Bastet, Horus, Sobek, Isis, Seth, Chnum, Thoth, Anubis).
- "PHARAOH": Pharao im Profil auf einem Thron.
- "GOLD": Drei goldene Gewichte auf einem Tisch.
- "NILE" (Nil): Blaue Flusslandschaft mit Schilf und Boot, aber OHNE Sonne.
- "FLOOD" (Überschwemmung): Flusslandschaft MIT einer orange/roten Sonne am Himmel.

KATASTROPHEN-Plättchen (immer mit einem quadratischen schwarzen Symbol mit geschwungenen Schlangen darauf):
- "BURIAL" (Begräbnis): Mumie/Sarkophag + Schlangen-Symbol.
- "DROUGHT" (Dürre): Austrocknender, rissiger Boden + Schlangen-Symbol.
- "UNREST" (Unruhen): Kämpfende Gruppe Menschen + Schlangen-Symbol.
- "EARTHQUAKE" (Erdbeben): Einstürzendes Gebäude + Schlangen-Symbol.

Gib strenges, rohes JSON ohne Markdown (kein \`\`\`json) zurück.
Beispiel: {"type": "MONUMENT", "subtype": "Sphinx"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      let responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(cleaned);

      res.json(result);
    } catch (err: any) {
      console.error("Error identifying tile:", err);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
