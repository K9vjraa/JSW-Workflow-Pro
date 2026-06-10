import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin strictly if available for verifying tokens
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());
  app.use(cors());

  const server = http.createServer(app);
  
  // Realtime Socket Server
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    // Join a user-specific room
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${socket.id} joined personal room user_${userId}`);
    });

    // Join a department or task room
    socket.on("join_room", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("send_message", (data) => {
      // data: { room, sender, message, timestamp }
      io.to(data.room).emit("receive_message", data);
    });

    socket.on("typing", (data) => {
      socket.to(data.room).emit("typing", data);
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.room).emit("stop_typing", data);
    });

    socket.on("read_receipt", (data) => {
      socket.to(data.room).emit("read_receipt", data);
    });

    socket.on("task_update", (data) => {
      io.to(data.department).emit("task_updated", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Protected API Middleware logic
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (supabase) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });
        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: "Invalid token" });
        
        // Attach user to request for downstream usage
        (req as any).user = user;
    }
    // If no Supabase env is set, it passes through for local mock demo mode
    next();
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example of protected analytics API
  app.get("/api/analytics/department", requireAuth, (req, res) => {
    res.json({ data: "Protected department analytics" });
  });

  // Tasks API (Node.js + Express layer showcasing backend architecture)
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
        if (!supabase) return res.json({ tasks: [] });
        const user = (req as any).user; 
        let query = supabase.from('tasks').select('*');
        if (user) {
            // Further RLS applies automatically if we use client token, 
            // but here we are using service_role or just passing through.
            // Ideally we'd instantiate a user-scoped client if using Express as a proxy.
        }
        const { data, error } = await query;
        if (error) throw error;
        res.json({ tasks: data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
      try {
          if (!supabase) return res.status(500).json({ error: "DB not initialized" });
          const { data, error } = await supabase.from('tasks').insert(req.body).select().single();
          if (error) throw error;
          res.json(data);
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // Gemini API Proxy
  app.post("/api/ai/report", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "No text provided for report generation." });
      }

      const prompt = `Convert the following worker field notes into a professional industrial maintenance report.
      
Worker Notes:
"${text}"

Format the report with the following structure, using clear professional terminology suited for an enterprise manufacturing/industrial plant (like a steel plant):
- **Executive Summary**: A one-sentence summary of the task.
- **Action Taken**: Bullet points detailing the operations performed.
- **Observations**: What was noticed during the task (wear, conditions, measurements).
- **Recommendations/Next Steps**: What should be done next, if anything.

Make it clear, concise, and highly professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      });
      
      if (!response.text) {
        throw new Error("Received empty response from AI model.");
      }
      
      res.json({ report: response.text });
    } catch (err: any) {
      console.error("AI Report Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI report" });
    }
  });

  app.post("/api/ai/task", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { issue } = req.body;
      
      if (!issue || !issue.trim()) {
        return res.status(400).json({ error: "No issue provided for task generation." });
      }

      const prompt = `You are an expert industrial maintenance planner for a large enterprise (e.g., a steel plant).
The user reported the following issue:
"${issue}"

Generate a comprehensive maintenance plan in JSON format. Do NOT wrap it in markdown block quotes. Return raw JSON matching exactly this schema:
{
  "inspectionChecklist": ["item 1", "item 2", ...],
  "suggestedTasks": ["task 1", "task 2", ...],
  "safetyChecks": ["safety 1", "safety 2", ...],
  "requiredAttachments": ["attachment type 1", "attachment type 2", ...]
}

Make the points highly specific, professional, and actionable.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      });
      
      if (!response.text) {
        throw new Error("Received empty response from AI model.");
      }
      
      const parsed = JSON.parse(response.text);
      res.json(parsed);
    } catch (err: any) {
      console.error("AI Task Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI task plan" });
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
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
