import React, { useState, useEffect, useRef } from 'react';
import genieAvatar from '../assets/hero.png';
import { Preferences } from '@capacitor/preferences';

export default function ChatTab({ profile, onBookService }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [city, setCity] = useState('Hyderabad, Sindh');
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Isolate storage key by the user's phone number
  const storageKey = profile?.phone ? `khidmatai_chat_history_${profile.phone}` : 'khidmatai_chat_history';

  // Load saved city and chat history
  useEffect(() => {
    const loadData = async () => {
      try {
        const { value } = await Preferences.get({ key: 'saved_city' });
        if (value) setCity(value);

        const history = localStorage.getItem(storageKey);
        if (history) {
          setMessages(JSON.parse(history));
        } else {
          // Initial greeting
          const initialMsgs = [
            {
              id: 'init-1',
              sender: 'ai',
              text: `Assalam-o-Alaikum ${profile?.name || ''}! Main KhidmatAI hoon. Main ${value || 'Hyderabad'} mein aap ki kya madad kar sakta hoon?`,
              urduText: `السلام علیکم ${profile?.name || ''}! میں خدمت اے آئی ہوں۔ میں ${value || 'حیدرآباد'} میں آپ کی کیا مدد کر سکتا ہوں؟`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
          setMessages(initialMsgs);
          localStorage.setItem(storageKey, JSON.stringify(initialMsgs));
        }
      } catch (e) {
        console.error("Error loading chat data", e);
      }
    };
    loadData();
  }, [profile, storageKey]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveHistory = (newMsgs) => {
    setMessages(newMsgs);
    localStorage.setItem(storageKey, JSON.stringify(newMsgs));
  };

  const handleSend = (text, isImage = false) => {
    const msgText = text || input;
    if (!msgText.trim() && !imagePreview) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: msgText,
      image: imagePreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMsgs = [...messages, userMsg];
    saveHistory(newMsgs);
    setInput('');
    setImagePreview(null);

    // Simulate AI response
    setTimeout(() => {
      let aiResponseText = `Bhai, aap ki request mil gayi hai. Hum aap ke liye ${city.split(',')[0]} mein behtareen service provider dhoondh rahe hain.`;
      let aiUrduText = `بھائی، آپ کی درخواست مل گئی ہے۔ ہم آپ کے لیے ${city.split(',')[0]} میں بہترین سروس پرووائیڈر ڈھونڈ رہے ہیں۔`;
      let showBookButton = false;
      let serviceType = 'plumber';

      if (isImage || userMsg.image) {
        aiResponseText = "Ye pipe leak lag raha hai, estimated repair cost Rs.800-1200.";
        aiUrduText = "یہ پائپ لیک لگ رہا ہے، اندازاً مرمت کا خرچہ 800 سے 1200 روپے ہوگا۔";
        showBookButton = true;
        serviceType = 'plumber';
      } else {
        const lowerText = msgText.toLowerCase();
        if (lowerText.includes('plumber') || lowerText.includes('nal') || lowerText.includes('leak')) {
          aiResponseText = `Bhai, ${city.split(',')[0]} mein humare pas top-rated plumbers available hain. Starting at Rs.500.`;
          aiUrduText = `بھائی، ${city.split(',')[0]} میں ہمارے پاس ٹاپ ریٹیڈ پلمبرز دستیاب ہیں۔ ابتدائی ریٹ 500 روپے۔`;
          showBookButton = true;
          serviceType = 'plumber';
        } else if (lowerText.includes('ac') || lowerText.includes('cooling') || lowerText.includes('cool')) {
          aiResponseText = `AC service aur repair ke liye humare experts ready hain. Rate starts at Rs.800.`;
          aiUrduText = "اے سی سروس اور مرمت کے لیے ہمارے ماہرین تیار ہیں۔ ریٹ 800 روپے سے شروع ہوتا ہے۔";
          showBookButton = true;
          serviceType = 'ac_repair';
        } else if (lowerText.includes('clean') || lowerText.includes('safai')) {
          aiResponseText = "Deep cleaning aur safai ke liye specialists Rs.1000 se shuru hain.";
          aiUrduText = "ڈیپ کلیننگ اور صفائی کے لیے ماہرین 1000 روپے سے شروع ہیں۔";
          showBookButton = true;
          serviceType = 'cleaning';
        } else if (lowerText.includes('electric') || lowerText.includes('bijli') || lowerText.includes('short')) {
          aiResponseText = "Electricians for wiring repair starting at Rs.500 only.";
          aiUrduText = "وائرنگ کی مرمت کے لیے الیکٹریشن صرف 500 روپے سے شروع ہیں۔";
          showBookButton = true;
          serviceType = 'electrician';
        }
      }

      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        urduText: aiUrduText,
        showBookButton,
        serviceType,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveHistory([...newMsgs, aiMsg]);
    }, 1000);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    if (window.confirm("Bhai, kya aap chat history delete karna chahte hain?")) {
      const initialMsgs = [
        {
          id: 'init-1',
          sender: 'ai',
          text: `Assalam-o-Alaikum ${profile?.name || ''}! Main KhidmatAI hoon. Main ${city} mein aap ki kya madad kar sakta hoon?`,
          urduText: `السلام علیکم ${profile?.name || ''}! میں خدمت اے آئی ہوں۔ میں ${city} میں آپ کی کیا مدد کر سکتا ہوں؟`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      saveHistory(initialMsgs);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-5 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#004b24] to-[#006633]">
            <span className="material-symbols-outlined text-white text-[18px]">auto_awesome</span>
          </div>
          <h1 className="text-lg font-bold ai-gradient-text">KhidmatAI Chat</h1>
        </div>
        <button onClick={clearChat} className="text-red-600 hover:bg-red-50 p-2 rounded-full active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </header>

      {/* Main Chat Area */}
      <div className="flex-grow overflow-y-auto px-4 pt-20 pb-44 space-y-4">
        {/* Helper Chips */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {[
              { label: 'Plumber chahiye', text: 'Mujhe ek plumber chahiye ghar ke leak pipe ke liye.' },
              { label: 'AC ka rate?', text: 'AC repair aur service ka kya rate hai?' },
              { label: 'Safai service', text: 'Ghar ki safai karwani hai, maid available hai?' },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSend(chip.text)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm active:scale-95 hover:bg-gray-50 transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-emerald-100 border border-emerald-200">
                <img src={genieAvatar} className="w-full h-full object-contain" alt="Genie" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${msg.sender === 'user' ? 'bg-[#004b24] text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
              {msg.image && (
                <img src={msg.image} className="w-full max-h-48 object-cover rounded-lg mb-2" alt="Uploaded file" />
              )}
              {msg.urduText && (
                <p className="text-sm font-semibold mb-1 text-right" dir="rtl">{msg.urduText}</p>
              )}
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
              <div className={`text-[9px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                {msg.time}
              </div>

              {msg.sender === 'ai' && msg.showBookButton && (
                <button
                  onClick={() => onBookService(msg.serviceType)}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-[#004b24] to-[#006633] text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all text-center"
                >
                  Book Now / ابھی بک کریں
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Floating Image Preview */}
      {imagePreview && (
        <div className="fixed bottom-36 left-4 right-4 p-3 bg-white border border-gray-200 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <img src={imagePreview} className="w-14 h-14 object-cover rounded-lg" alt="Preview" />
          <div className="flex-grow">
            <p className="text-xs font-bold text-gray-700">Image selected</p>
            <p className="text-[10px] text-gray-400">Ready to send</p>
          </div>
          <button onClick={() => setImagePreview(null)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-40 flex flex-col items-center">
        <div className="w-full max-w-2xl flex items-center px-4 h-14 rounded-full shadow bg-white/90 backdrop-blur-md border border-white/50">
          <button
            onClick={handlePlusClick}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-gray-500 hover:bg-black/5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
          </button>
          <input
            type="text"
            className="flex-grow w-0 min-w-0 bg-transparent border-none outline-none h-full py-2 px-2 text-[15px] text-[#1a1c1e] focus:ring-0"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() && !imagePreview}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40 bg-gradient-to-b from-[#004b24] to-[#006633] text-white shadow-lg"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
