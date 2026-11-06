import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import app from './src/server/app';
import { db } from './src/server/db';
import { allocateHospital } from './src/server/hospitalEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Development vs Production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Sanjeevani Triage] Vite dev middleware mounted');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Sanjeevani Triage] Serving static build from dist');
  }

  // Create HTTP server to attach both Express and WebSocketServer
  const server = http.createServer(app);

  // Setup WebSocketServer for Gemini Live API (gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/api/live' });

  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Gemini Live] New client WebSocket connection opened');

    if (!ai) {
      clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }));
      clientWs.close();
      return;
    }

    try {
      let session: any = null;

      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are Sanjeevani Live, an empathetic, real-time voice healthcare assistant.
Converse naturally in Telugu, Hindi, or English based on the patient's language.
Listen carefully to symptoms, reassure patients, ask gentle clarifying questions about duration and severity, and provide guidance on OPD tokens or emergency red flags.
Keep responses concise, natural, and spoken conversational.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'text',
                    text: part.text,
                  })
                );
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
          },
          onclose: () => {
            console.log('[Gemini Live] Session closed');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('[Gemini Live Error]:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live API error' }));
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ type: 'ready', message: 'Gemini 3.8 Live session established.' }));

      clientWs.on('message', (rawData) => {
        try {
          const parsed = JSON.parse(rawData.toString());
          if (parsed.type === 'book_opd' || parsed.action === 'book_opd') {
            const user = db.getDefaultUser();
            const dept = parsed.department || 'General Medicine';
            const match = allocateHospital(17.7124, 83.3156, dept);
            const triageId = `TRG-${Date.now().toString().slice(-6)}`;
            const token = db.generateToken(
              user.id,
              triageId,
              match.hospital.hospital_id,
              match.hospital.hospital_name,
              dept,
              5,
              match.distance_km
            );
            clientWs.send(JSON.stringify({ type: 'opd_token_booked', token, hospital: match.hospital }));
            return;
          }

          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          } else if (parsed.text && session) {
            session.sendRealtimeInput({
              text: parsed.text,
            });

            const textLower = (parsed.text || '').toLowerCase();
            if (
              textLower.includes('ఓపీడీ') ||
              textLower.includes('టోకెన్') ||
              textLower.includes('బుక్') ||
              textLower.includes('ओपीडी') ||
              textLower.includes('टोकन') ||
              textLower.includes('बुक') ||
              textLower.includes('book opd') ||
              textLower.includes('token')
            ) {
              const user = db.getDefaultUser();
              const dept = 'General Medicine';
              const match = allocateHospital(17.7124, 83.3156, dept);
              const triageId = `TRG-${Date.now().toString().slice(-6)}`;
              const token = db.generateToken(
                user.id,
                triageId,
                match.hospital.hospital_id,
                match.hospital.hospital_name,
                dept,
                5,
                match.distance_km
              );
              clientWs.send(JSON.stringify({ type: 'opd_token_booked', token, hospital: match.hospital }));
            }
          }
        } catch (e) {
          console.error('[Gemini Live] Error sending realtime input:', e);
        }
      });

      clientWs.on('close', () => {
        console.log('[Gemini Live] Client WebSocket disconnected');
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });
    } catch (err: any) {
      console.error('[Gemini Live] Failed to connect session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Failed to establish Live session' }));
      }
      clientWs.close();
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sanjeevani Triage] Server running at http://0.0.0.0:${PORT} with Live API WebSocket at /api/live`);
  });
}

startServer().catch((err) => {
  console.error('[Sanjeevani Triage] Failed to start server:', err);
  process.exit(1);
});
