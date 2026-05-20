const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup Multer for memory upload
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin (Firestore)
let db;
const firebaseConfigJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (firebaseConfigJson) {
  try {
    const serviceAccount = JSON.parse(firebaseConfigJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firestore initialized successfully.");
  } catch (e) {
    console.error("Firebase admin init failed, using local mock db:", e);
    db = null;
  }
} else {
  console.log("No FIREBASE_SERVICE_ACCOUNT env variable found. Operating in local memory mock DB mode.");
}

// Local Memory Fallback DB
const mockBookings = [
  {
    id: "BKG-593A",
    service: "AC Repair",
    status: "Completed",
    price: "PKR 2,750",
    technician: "Zubair Ahmed",
    date: "2026-05-12"
  },
  {
    id: "BKG-112B",
    service: "Plumber",
    status: "Completed",
    price: "PKR 1,450",
    technician: "Sajid Ali",
    date: "2026-04-28"
  }
];

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyCdsOCgw5xwmCZhCGG1BEcrJEZfRh5xgVk";
let genAI;
if (geminiApiKey) {
  try {
    // Note: The newer GoogleGenAI or @google/generative-ai uses:
    const { GoogleGenAI } = require('@google/generative-ai');
    // or just require the package:
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log("Gemini API client initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client", err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. GET /api/bookings
app.get('/api/bookings', async (req, res) => {
  if (db) {
    try {
      const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return res.json(list);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    return res.json(mockBookings);
  }
});

// 2. POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  const { service, price, customerName, customerPhone, slotTime, city, isEmergency } = req.body;
  const bookingId = `BKG-${Math.random().toString(36).substring(3, 9).toUpperCase()}`;

  const newBooking = {
    id: bookingId,
    service: service || "General Fix",
    price: price || "PKR 1,500",
    customerName: customerName || "Ali Khan",
    customerPhone: customerPhone || "+92 300 1234567",
    status: "New",
    slotTime: slotTime || "4:00 PM",
    city: city || "Hyderabad",
    isEmergency: !!isEmergency,
    createdAt: new Date().toISOString()
  };

  if (db) {
    try {
      await db.collection('bookings').doc(bookingId).set(newBooking);
      return res.json({ success: true, booking: newBooking });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    mockBookings.unshift(newBooking);
    return res.json({ success: true, booking: newBooking });
  }
});

// 3. POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, city } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // If agentic python backend is configured, forward request to trigger 8-agent pipeline & traces
  const agentBackendUrl = process.env.AGENT_BACKEND_URL;
  if (agentBackendUrl) {
    try {
      console.log(`Forwarding request to Agentic Backend: ${agentBackendUrl}/api/v1/requests`);
      const response = await fetch(`${agentBackendUrl}/api/v1/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_input: message,
          user_id: req.body.userId || "USR-DEMO",
          location_label: city || "Hyderabad"
        })
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Agentic backend response received for session: ${data.session_id}`);
        return res.json({
          intent: data.intent?.service_type || "plumber",
          complexity: data.price_breakdown?.complexity || "basic",
          romanUrduResponse: data.price_breakdown?.explanation_roman_urdu || `Bhai, humne aap ke liye matching provider dhoondh liya hai. Estimated price: Rs. ${data.price_breakdown?.final_price || 800}`,
          urduScriptResponse: data.price_breakdown?.explanation_urdu || `ہم نے آپ کے لیے موزوں سروس فراہم کنندہ تلاش کر لیا ہے۔ متوقع قیمت: Rs. ${data.price_breakdown?.final_price || 800}`,
          estimatedPrice: data.price_breakdown?.final_price || 800,
          sessionId: data.session_id
        });
      } else {
        console.warn("Agentic backend returned status:", response.status);
      }
    } catch (err) {
      console.warn("Failed to connect to agentic backend, falling back to Gemini:", err);
    }
  }

  // Fallback default response in case Gemini fails or is not config
  let responseText = "Bhai, aap ki request mil gayi hai. Hum aap ke liye matching provider dhoondh rahe hain.";
  let urduResponseText = "بھائی، آپ کی درخواست mil gayi hai. Hum aap ke liye matching provider dhoondh rahe hain.";
  let complexity = "basic";
  let estimatedPrice = 800;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are KhidmatAI, a smart multilingual service assistant for Pakistan.
        The user resides in ${city || 'Hyderabad, Sindh'}.
        User message: "${message}"

        Analyze the message and perform:
        1. Classify intent (e.g. plumbing, AC repair, cleaning, electrician, or other).
        2. Detect input language: Urdu, English, Roman Urdu (e.g., "nal kharab hai").
        3. Classify job complexity as 'basic', 'intermediate', or 'complex' based on the description.
        4. Draft a friendly, brief response in Roman Urdu and also in formal Urdu script.
        5. Suggest an estimated cost in PKR.

        Return a JSON object with this exact format:
        {
          "intent": "plumbing",
          "complexity": "basic",
          "romanUrduResponse": "Bhai, aap ke leak pipe ke liye basic plumber starting at Rs.500 mil jayega.",
          "urduScriptResponse": "بھائی، آپ کے لیک پائپ کے لیے بنیادی پلمبر سروس 500 روپے سے شروع ہو جائے گی۔",
          "estimatedPrice": 500
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Parse JSON from markdown or raw text
      const cleanJsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJsonText);

      return res.json(parsed);
    } catch (err) {
      console.warn("Gemini generation failed, using local fallback rules:", err);
    }
  }

  // Local fallback parsing
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('plumber') || lowerMsg.includes('leak') || lowerMsg.includes('nal')) {
    responseText = "Bhai, leakage issues require a basic plumber. Starting rate is Rs.500.";
    urduResponseText = "بھائی، نلکے کے مسئلے کے لیے پلمبر کی سروس 500 روپے سے شروع ہوتی ہے۔";
    complexity = "basic";
    estimatedPrice = 500;
  } else if (lowerMsg.includes('ac') || lowerMsg.includes('gas') || lowerMsg.includes('cooling')) {
    responseText = "AC issues are classified as Intermediate/Complex. Repair cost starts at Rs.1200.";
    urduResponseText = "اے سی سروس اور کمپریسر کے مسائل درمیانے اور پیچیدہ نوعیت کے ہوتے ہیں۔ سروس کا آغاز 1200 روپے سے ہوتا ہے۔";
    complexity = "intermediate";
    estimatedPrice = 1200;
  }

  return res.json({
    intent: "service_request",
    complexity,
    romanUrduResponse: responseText,
    urduScriptResponse: urduResponseText,
    estimatedPrice
  });
});

// 4. POST /api/upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }
  // Mock image analysis
  return res.json({
    imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
    analysis: "Ye pipe leak lag raha hai, estimated Rs.800-1200",
    urduAnalysis: "یہ پائپ لیک لگ رہا ہے، اندازاً لاگت 800 سے 1200 روپے ہوگی۔"
  });
});

// 5. POST /api/bookings/:id/status (for admin tracking updates)
app.post('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, technician } = req.body;

  if (db) {
    try {
      const updateData = {};
      if (status) updateData.status = status;
      if (technician) updateData.technician = technician;

      await db.collection('bookings').doc(id).update(updateData);
      return res.json({ success: true, bookingId: id, updated: updateData });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const booking = mockBookings.find(b => b.id === id);
    if (booking) {
      if (status) booking.status = status;
      if (technician) booking.technician = technician;
      return res.json({ success: true, bookingId: id, updated: { status, technician } });
    }
    return res.status(404).json({ error: "Booking not found." });
  }
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
