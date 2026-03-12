import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Send, 
  User, 
  Settings, 
  Lock, 
  Cpu, 
  Wifi, 
  Shield, 
  Search,
  MoreVertical,
  Hash,
  MessageSquare,
  Zap,
  Phone,
  Key,
  Smile,
  Image as ImageIcon,
  LogOut,
  ChevronLeft,
  Mic,
  Video,
  Camera,
  Globe,
  Bell,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { format } from 'date-fns';
import { telegramService } from './services/telegramService';

type LoginStep = 'API_KEYS' | 'PHONE' | 'CODE' | 'PASSWORD' | 'SUCCESS';

interface Chat {
  id: any;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  entity: any;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  type: 'sent' | 'received' | 'system';
  date: number;
  media?: {
    type: 'photo' | 'video' | 'audio' | 'document' | 'sticker';
    url?: string;
    loading?: boolean;
    raw?: any;
  };
}

const MessageText = ({ text }: { text: string }) => {
  // Simple regex for links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap mb-1">
      {parts.map((part, i) => 
        urlRegex.test(part) ? (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-hacker-green underline hover:text-white transition-colors"
          >
            {part}
          </a>
        ) : part
      )}
    </p>
  );
};

const MediaContent = ({ media }: { media: Message['media'] }) => {
  if (!media) return null;
  if (media.loading) return <div className="w-40 h-40 bg-hacker-dark animate-pulse flex items-center justify-center text-[10px]">DOWNLOADING...</div>;
  if (!media.url) return <div className="text-[10px] text-red-500">FAILED TO LOAD MEDIA</div>;

  switch (media.type) {
    case 'photo':
      return <img src={media.url} alt="Telegram Photo" className="max-w-full rounded border border-hacker-green/30 cursor-pointer" onClick={() => window.open(media.url, '_blank')} referrerPolicy="no-referrer" />;
    case 'video':
      return (
        <div className={media.raw?.media?.videoNote ? "w-48 h-48 rounded-full overflow-hidden border-2 border-hacker-green/50" : "max-w-full rounded border border-hacker-green/30"}>
          <video src={media.url} controls className="w-full h-full object-cover" />
        </div>
      );
    case 'audio':
      return (
        <div className="flex items-center gap-2 p-2 bg-hacker-dark border border-hacker-green/30 rounded">
          <Mic className="w-4 h-4 text-hacker-green" />
          <audio src={media.url} controls className="w-full h-8" />
        </div>
      );
    case 'sticker':
      return <img src={media.url} alt="Sticker" className="w-32 h-32" referrerPolicy="no-referrer" />;
    default:
      return (
        <a href={media.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-hacker-dark border border-hacker-green/30 rounded hover:bg-hacker-green/10 transition-colors">
          <ImageIcon className="w-4 h-4" />
          <span className="text-xs">DOWNLOAD DOCUMENT</span>
        </a>
      );
  }
};

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loginStep, setLoginStep] = useState<LoginStep>('API_KEYS');
  const [apiId, setApiId] = useState('23253087');
  const [apiHash, setApiHash] = useState('83cae4234a3aaff815926acf585b3e36');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualKeys, setShowManualKeys] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [profileData, setProfileData] = useState<any>(null);
  const [stickerSets, setStickerSets] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Resolvers for the login flow
  const resolvers = useRef<{
    phone?: (val: string) => void;
    code?: (val: string) => void;
    password?: (val: string) => void;
  }>({});

  const initialized = useRef(false);

  useEffect(() => {
    if (apiId && apiHash && !initialized.current) {
      initialized.current = true;
      handleInitialize();
    }

    if (booting) {
      const lines = [
        "> INITIALIZING DR4X0N OS v4.0.2...",
        "> LOADING KERNEL MODULES...",
        "> ESTABLISHING ENCRYPTED TUNNEL...",
        "> BYPASSING FIREWALLS...",
        "> DECRYPTING USER DATA...",
        "> ACCESS GRANTED.",
        "> WELCOME TO WEB DR4X0N TG."
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < lines.length) {
          setBootLines(prev => [...prev, lines[i]]);
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setBooting(false), 1000);
        }
      }, 400);
      return () => clearInterval(interval);
    }
  }, [booting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInitialize = async () => {
    if (!apiId || !apiHash) {
      setError("MISSING_API_CREDENTIALS");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await telegramService.initialize(parseInt(apiId), apiHash);
      console.log("Initialization successful");
    } catch (err: any) {
      console.error("Initialization failed:", err);
      setError(err.message || "FAILED TO CONNECT TO TELEGRAM SERVERS.");
      setLoading(false);
      return;
    }
    
    try {
      telegramService.login({
        phoneNumber: () => new Promise(resolve => {
          resolvers.current.phone = resolve;
          setLoginStep('PHONE');
          setLoading(false);
        }),
        phoneCode: () => new Promise(resolve => {
          resolvers.current.code = resolve;
          setLoginStep('CODE');
          setLoading(false);
        }),
        password: () => new Promise(resolve => {
          resolvers.current.password = resolve;
          setLoginStep('PASSWORD');
          setLoading(false);
        })
      }).then(async () => {
        setLoginStep('SUCCESS');
        const meData = await telegramService.getMe();
        setMe(meData);
        loadDialogs();
        
        telegramService.onNewMessage(async (msg) => {
          // Handle incoming messages
          if (activeChat && msg.peerId?.userId?.toString() === activeChat.id.toString()) {
            let text = msg.message;
            let media: Message['media'] = undefined;

            if (msg.media) {
              if (msg.media.photo) media = { type: 'photo', loading: true, raw: msg };
              else if (msg.media.document) {
                const doc = msg.media.document;
                if (doc.mimeType?.startsWith('video/')) media = { type: 'video', loading: true, raw: msg };
                else if (doc.mimeType?.startsWith('audio/') || doc.attributes?.some((a: any) => a.className === 'DocumentAttributeAudio')) {
                  media = { type: 'audio', loading: true, raw: msg };
                }
                else if (msg.media.sticker) media = { type: 'sticker', loading: true, raw: msg };
                else media = { type: 'document', loading: true, raw: msg };
              }
            }

            const newMsg: Message = {
              id: msg.id,
              sender: msg.fromId?.userId?.toString() || 'unknown',
              text: text,
              type: (msg.out ? 'sent' : 'received') as 'sent' | 'received',
              date: msg.date,
              media
            };
            setMessages(prev => [...prev, newMsg]);

            if (media && media.loading) {
              const url = await telegramService.downloadMedia(msg);
              if (url) {
                setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, media: { ...m.media!, url, loading: false } } : m));
              }
            }
          }
          loadDialogs(); // Refresh chat list
        });

      }).catch(err => {
        setError(err.message || "LOGIN_FAILED");
        setLoginStep('API_KEYS');
      });

    } catch (err: any) {
      setError(err.message || "INITIALIZATION_FAILED");
      setLoading(false);
    }
  };

  const loadDialogs = async () => {
    const dialogs = await telegramService.getDialogs();
    const formattedChats: Chat[] = dialogs.map((d: any) => {
      let lastMsg = d.message?.message || '';
      if (d.message?.media && d.message.media.sticker) {
        lastMsg = '🖼️ Sticker';
      }
      return {
        id: d.id,
        name: d.title || 'Unknown',
        lastMessage: lastMsg,
        time: d.message ? format(new Date(d.message.date * 1000), 'HH:mm') : '',
        unread: d.unreadCount,
        online: false,
        entity: d.entity
      };
    });
    setChats(formattedChats);
    if (!activeChat && formattedChats.length > 0) {
      handleSelectChat(formattedChats[0]);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setActiveChat(chat);
    setLoading(true);
    const msgs = await telegramService.getMessages(chat.entity);
    const formattedMsgs: Message[] = msgs.map((m: any) => {
      let text = m.message;
      let media: Message['media'] = undefined;

      if (m.media) {
        if (m.media.photo) media = { type: 'photo', loading: true, raw: m };
        else if (m.media.document) {
          const doc = m.media.document;
          if (doc.mimeType?.startsWith('video/')) media = { type: 'video', loading: true, raw: m };
          else if (doc.mimeType?.startsWith('audio/') || doc.attributes?.some((a: any) => a.className === 'DocumentAttributeAudio')) {
            media = { type: 'audio', loading: true, raw: m };
          }
          else if (m.media.sticker) media = { type: 'sticker', loading: true, raw: m };
          else media = { type: 'document', loading: true, raw: m };
        }
      }

      return {
        id: m.id,
        sender: m.fromId?.userId?.toString() || 'unknown',
        text: text,
        type: (m.out ? 'sent' : 'received') as 'sent' | 'received',
        date: m.date,
        media
      };
    }).reverse();
    setMessages(formattedMsgs);
    setLoading(false);

    // Load media URLs in background
    formattedMsgs.forEach(async (msg, index) => {
      if (msg.media && msg.media.loading) {
        const url = await telegramService.downloadMedia(msg.media.raw);
        if (url) {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, media: { ...m.media!, url, loading: false } } : m));
        }
      }
    });
  };

  const handleViewProfile = async () => {
    if (!activeChat) return;
    setLoading(true);
    try {
      let data;
      if (activeChat.entity.className === 'User') {
        data = await telegramService.getFullUser(activeChat.entity.id);
      } else if (activeChat.entity.className === 'Chat') {
        data = await telegramService.getFullChat(activeChat.entity.id);
      } else if (activeChat.entity.className === 'Channel') {
        data = await telegramService.getFullChannel(activeChat.entity);
      }
      setProfileData(data);
      setShowProfile(true);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    setLoading(true);
    try {
      await telegramService.sendMedia(activeChat.entity, file, "");
      loadDialogs();
      handleSelectChat(activeChat);
    } catch (err) {
      console.error("Failed to send media:", err);
    }
    setLoading(false);
  };

  const handleStartRecording = async (type: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      setRecordingType(type);
      setIsRecording(true);
      chunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        const file = new File([blob], `recording.${type === 'video' ? 'webm' : 'ogg'}`, { type: blob.type });
        
        if (activeChat) {
          setLoading(true);
          try {
            await telegramService.sendMedia(activeChat.entity, file, "", type === 'video', type === 'audio');
            loadDialogs();
            handleSelectChat(activeChat);
          } catch (err) {
            console.error("Failed to send recording:", err);
          }
          setLoading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpdateProfile = async (firstName: string, about: string) => {
    setLoading(true);
    try {
      await telegramService.updateProfile({ firstName, about });
      const newMe = await telegramService.getMe();
      setMe(newMe);
      setShowSettings(false);
    } catch (err) {
      console.error("Update profile error:", err);
    }
    setLoading(false);
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    // Basic logout logic
    localStorage.clear();
    window.location.reload();
  };

  const handleProvidePhone = () => {
    if (!phoneNumber) return;
    setLoading(true);
    resolvers.current.phone?.(phoneNumber);
  };

  const handleProvideCode = () => {
    if (!phoneCode) return;
    setLoading(true);
    resolvers.current.code?.(phoneCode);
  };

  const handleProvidePassword = () => {
    if (!password) return;
    setLoading(true);
    resolvers.current.password?.(password);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const text = inputText;
    setInputText('');
    setShowEmojiPicker(false);

    try {
      const sentMsg = await telegramService.sendMessage(activeChat.entity, text);
      if (sentMsg) {
        const newMessage: Message = {
          id: sentMsg.id,
          sender: 'me',
          text: text,
          type: 'sent',
          date: Math.floor(Date.now() / 1000)
        };
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  if (booting) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-8 font-mono">
        <div className="max-w-md w-full">
          <div className="text-hacker-green mb-8 text-4xl font-bold hacker-glow text-center">
            DR4X0N_TG
          </div>
          <div className="space-y-2">
            {bootLines.map((line, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-hacker-green text-sm"
              >
                {line}
              </motion.div>
            ))}
            <motion.div 
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-2 h-5 bg-hacker-green inline-block ml-1 align-middle"
            />
          </div>
        </div>
      </div>
    );
  }

  if (loginStep !== 'SUCCESS') {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center p-4 font-mono">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full hacker-border p-8 bg-black/80 backdrop-blur-sm"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full border border-hacker-green hacker-glow">
              <Shield className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 hacker-glow uppercase">
            {loginStep === 'API_KEYS' ? 'Authentication Required' : 
             loginStep === 'PHONE' ? 'Identity Verification' : 
             loginStep === 'CODE' ? 'Security Code' : 'Two-Step Verification'}
          </h1>
          <p className="text-xs text-center mb-8 opacity-60">SECURE TERMINAL ACCESS v4.0.2</p>
          
          <AnimatePresence mode="wait">
            {loginStep === 'API_KEYS' && (
              <motion.div 
                key="api"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 flex flex-col items-center justify-center gap-4"
              >
                {error ? (
                  <div className="w-full space-y-4">
                    <div className="p-4 border border-red-500 bg-red-500/10 text-red-500 text-xs font-mono">
                      <div className="font-bold mb-2 uppercase tracking-widest">Connection Error</div>
                      <div className="opacity-80 break-words">{error}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setError("");
                        setLoginStep('API_KEYS');
                        setShowManualKeys(true);
                      }}
                      className="w-full hacker-button flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      RECONFIGURE API KEYS
                    </button>
                  </div>
                ) : (
                  <>
                    <Zap className="w-12 h-12 animate-spin text-hacker-green" />
                    <div className="text-xs animate-pulse font-mono">SYNCHRONIZING WITH TELEGRAM NODES...</div>
                  </>
                )}
              </motion.div>
            )}

            {showManualKeys && loginStep === 'API_KEYS' && (
              <motion.div 
                key="manual-api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2">API_ID</label>
                  <input 
                    type="text" 
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    placeholder="ENTER API ID"
                    className="w-full hacker-input"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2">API_HASH</label>
                  <input 
                    type="password" 
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    placeholder="ENTER API HASH"
                    className="w-full hacker-input"
                  />
                </div>
                <button 
                  onClick={() => {
                    setShowManualKeys(false);
                    handleInitialize();
                  }}
                  disabled={loading}
                  className="w-full hacker-button mt-4 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  RETRY CONNECTION
                </button>
              </motion.div>
            )}

            {loginStep === 'PHONE' && (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2">PHONE_NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+998901234567"
                      className="w-full hacker-input pl-8"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleProvidePhone}
                  disabled={loading}
                  className="w-full hacker-button mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'SENDING...' : 'REQUEST ACCESS CODE'}
                </button>
              </motion.div>
            )}

            {loginStep === 'CODE' && (
              <motion.div 
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2">VERIFICATION_CODE</label>
                  <div className="relative">
                    <Key className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input 
                      type="text" 
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="ENTER 5-DIGIT CODE"
                      className="w-full hacker-input pl-8"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleProvideCode}
                  disabled={loading}
                  className="w-full hacker-button mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {loading ? 'VERIFYING...' : 'FINALIZE HANDSHAKE'}
                </button>
              </motion.div>
            )}

            {loginStep === 'PASSWORD' && (
              <motion.div 
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2">2FA_PASSWORD</label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER 2FA PASSWORD"
                      className="w-full hacker-input pl-8"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleProvidePassword}
                  disabled={loading}
                  className="w-full hacker-button mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {loading ? 'DECRYPTING...' : 'UNLOCK TERMINAL'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-2 border border-red-500 bg-red-500/10 text-red-500 text-[10px] text-center uppercase"
            >
              ERROR: {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col font-mono text-hacker-green overflow-hidden crt-flicker">
      {/* Top Status Bar */}
      <div className="h-10 border-b border-hacker-green flex items-center justify-between px-4 bg-hacker-dark/50">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">DR4X0N_TERMINAL</span>
          </div>
          <div className="hidden md:flex items-center gap-1 opacity-60">
            <Wifi className="w-3 h-3" />
            <span>SIGNAL: STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-1 opacity-60">
            <Lock className="w-3 h-3" />
            <span>E2EE: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="animate-pulse">●</span>
            <span>{format(new Date(), 'HH:mm:ss')} UTC</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-hacker-green flex flex-col bg-black transition-all ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-hacker-green flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
              <input 
                type="text" 
                placeholder="SEARCH NODES..." 
                className="w-full bg-hacker-dark border border-hacker-green/50 pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-hacker-green"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`p-4 border-b border-hacker-green/20 cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-hacker-green/10' : 'hover:bg-hacker-green/5'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 border border-hacker-green flex items-center justify-center bg-hacker-dark overflow-hidden">
                      {chat.name.charAt(0).toUpperCase()}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-hacker-green border-2 border-black rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold truncate text-hacker-green">{chat.name}</h3>
                      <span className="text-[10px] opacity-50">{chat.time}</span>
                    </div>
                    <p className="text-xs opacity-60 truncate">{chat.lastMessage || 'No messages'}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="flex w-5 h-5 bg-hacker-green text-black text-[10px] font-bold items-center justify-center rounded-full">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-hacker-green flex justify-around items-center bg-hacker-dark/30">
            <MessageSquare className="w-5 h-5 cursor-pointer hover:text-white" />
            <Zap className="w-5 h-5 cursor-pointer hover:text-white" />
            <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
            <LogOut className="w-5 h-5 cursor-pointer hover:text-red-500" onClick={() => window.location.reload()} />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col bg-black relative transition-all ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-hacker-green flex items-center justify-between px-6 bg-hacker-dark/20">
                <div className="flex items-center gap-4 cursor-pointer" onClick={handleViewProfile}>
                  <button className="md:hidden" onClick={(e) => { e.stopPropagation(); setActiveChat(null); }}>
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="w-10 h-10 border border-hacker-green flex items-center justify-center">
                    {activeChat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm hacker-glow">{activeChat.name}</h2>
                    <p className="text-[10px] opacity-60">{activeChat.online ? 'CONNECTED' : 'OFFLINE'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Shield className="w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer" />
                  <MoreVertical className="w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer" />
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[80%]">
                      <div className={`p-3 border relative group ${msg.type === 'sent' ? 'border-hacker-green bg-hacker-green/10 rounded-l-lg rounded-tr-lg' : 'border-hacker-green/50 bg-hacker-dark rounded-r-lg rounded-tl-lg'}`}>
                        <div className="flex justify-between items-center mb-1 gap-4">
                          <span className="text-[10px] font-bold uppercase opacity-50">
                            {msg.type === 'sent' ? 'OPERATOR' : activeChat.name}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-1">
                          {msg.text}
                        </p>
                        <MediaContent media={msg.media} />
                        <div className="flex justify-end items-center gap-1 opacity-40 mt-1">
                          <span className="text-[8px]">{format(new Date(msg.date * 1000), 'HH:mm')}</span>
                          {msg.type === 'sent' && (
                            <div className="flex">
                              <Zap className="w-2 h-2" />
                              <Zap className="w-2 h-2 -ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-hacker-green bg-hacker-dark/30 relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-6 mb-2 z-50" ref={emojiPickerRef}>
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={EmojiTheme.DARK}
                      lazyLoadEmojis={true}
                    />
                  </div>
                )}
                {showStickerPicker && (
                  <div className="absolute bottom-full left-6 mb-2 z-50 w-72 h-96 bg-hacker-dark border border-hacker-green overflow-y-auto p-4" ref={emojiPickerRef}>
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3,4,5,6,7,8,9].map(i => (
                        <div 
                          key={i} 
                          className="aspect-square border border-hacker-green/30 hover:bg-hacker-green/20 cursor-pointer flex items-center justify-center text-2xl"
                          onClick={() => {
                            telegramService.sendMessage(activeChat?.entity, `[STICKER_${i}]`);
                            setShowStickerPicker(false);
                          }}
                        >
                          🖼️
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {telegramService.canSendMessages(activeChat.entity) ? (
                  <form onSubmit={handleSendMessage} className="flex gap-4">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileSelect}
                    />
                    <div className="flex-1 relative flex items-center">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowStickerPicker(false);
                        }}
                        className="absolute left-3 text-hacker-green opacity-50 hover:opacity-100"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isRecording ? `RECORDING_${recordingType.toUpperCase()}...` : "COMMAND_INPUT..."}
                        disabled={isRecording}
                        className="w-full bg-black border border-hacker-green pl-12 pr-24 py-3 text-sm focus:outline-none focus:shadow-[0_0_10px_rgba(0,255,65,0.3)] transition-all disabled:opacity-50"
                      />
                      <div className="absolute right-3 flex items-center gap-2">
                        <button 
                          type="button"
                          onMouseDown={() => handleStartRecording('audio')}
                          onMouseUp={handleStopRecording}
                          onMouseLeave={handleStopRecording}
                          className={`text-hacker-green transition-all ${isRecording && recordingType === 'audio' ? 'scale-125 hacker-glow' : 'opacity-50 hover:opacity-100'}`}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                        <button 
                          type="button"
                          onMouseDown={() => handleStartRecording('video')}
                          onMouseUp={handleStopRecording}
                          onMouseLeave={handleStopRecording}
                          className={`text-hacker-green transition-all ${isRecording && recordingType === 'video' ? 'scale-125 hacker-glow' : 'opacity-50 hover:opacity-100'}`}
                        >
                          <Video className="w-5 h-5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-hacker-green opacity-50 hover:opacity-100"
                        >
                          <ImageIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isRecording}
                      className="hacker-button flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden md:inline">EXECUTE</span>
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-3 border border-hacker-green/30 text-xs opacity-50 uppercase tracking-widest">
                    READ-ONLY CHANNEL: UPLINK RESTRICTED
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <Terminal className="w-20 h-20 mb-4" />
              <p className="text-xl font-bold">SELECT A NODE TO BEGIN UPLINK</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full hacker-border bg-black p-8 relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 text-hacker-green hover:text-white"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
              
              <h2 className="text-2xl font-bold hacker-glow mb-6">SYSTEM_SETTINGS</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="w-20 h-20 border-2 border-hacker-green flex items-center justify-center bg-hacker-dark text-3xl font-bold">
                    {me?.firstName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{me?.firstName} {me?.lastName}</p>
                    <p className="text-[10px] opacity-50">@{me?.username || "NO_USERNAME"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase opacity-50 mb-1 block">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={me?.firstName}
                      onBlur={(e) => handleUpdateProfile(e.target.value, me?.about || "")}
                      className="w-full bg-black border border-hacker-green p-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase opacity-50 mb-1 block">Bio / Uplink Info</label>
                    <textarea 
                      defaultValue={me?.about}
                      onBlur={(e) => handleUpdateProfile(me?.firstName || "", e.target.value)}
                      className="w-full bg-black border border-hacker-green p-2 text-sm focus:outline-none h-24 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-hacker-green/30">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('telegram_session');
                      window.location.reload();
                    }}
                    className="w-full p-3 border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase"
                  >
                    TERMINATE_SESSION
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="max-w-2xl w-full h-[80vh] hacker-border bg-black flex overflow-hidden"
            >
              {/* Settings Sidebar */}
              <div className="w-64 border-r border-hacker-green/30 bg-hacker-dark/20 p-6 space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-hacker-green/10 border border-hacker-green text-hacker-green text-sm">
                  <User className="w-4 h-4" /> PROFILE
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-hacker-green/5 text-sm opacity-60 hover:opacity-100 transition-all">
                  <Bell className="w-4 h-4" /> NOTIFICATIONS
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-hacker-green/5 text-sm opacity-60 hover:opacity-100 transition-all">
                  <Shield className="w-4 h-4" /> PRIVACY
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-hacker-green/5 text-sm opacity-60 hover:opacity-100 transition-all">
                  <Database className="w-4 h-4" /> DATA & STORAGE
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-hacker-green/5 text-sm opacity-60 hover:opacity-100 transition-all">
                  <Globe className="w-4 h-4" /> LANGUAGE
                </button>
                <div className="pt-8">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 text-sm transition-all"
                  >
                    <LogOut className="w-4 h-4" /> TERMINATE_SESSION
                  </button>
                </div>
              </div>

              {/* Settings Content */}
              <div className="flex-1 p-8 overflow-y-auto scrollbar-hacker">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-bold hacker-glow">SYSTEM_SETTINGS</h2>
                  <button onClick={() => setShowSettings(false)} className="text-hacker-green hover:text-white">
                    <ChevronLeft className="w-6 h-6 rotate-180" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 border-2 border-hacker-green flex items-center justify-center bg-hacker-dark text-3xl font-bold">
                      {me?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{me?.firstName} {me?.lastName}</h3>
                      <p className="text-sm opacity-50">@{me?.username || 'anonymous'}</p>
                    </div>
                    <button className="ml-auto hacker-button text-xs py-1">EDIT_PROFILE</button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] opacity-40">Account Info</h4>
                    <div className="p-4 border border-hacker-green/20 bg-hacker-dark/30 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-60">Phone Number</span>
                        <span className="text-sm">+{me?.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-60">Username</span>
                        <span className="text-sm">@{me?.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-60">Bio</span>
                        <span className="text-sm italic">"Hacking the mainframe..."</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full hacker-border bg-black p-8 relative"
            >
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-4 right-4 text-hacker-green hover:text-white"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
              
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 border-2 border-hacker-green flex items-center justify-center bg-hacker-dark text-4xl font-bold">
                  {activeChat?.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold hacker-glow">{activeChat?.name}</h2>
                  <p className="text-xs opacity-60 mt-1 uppercase tracking-widest">
                    {activeChat?.entity.className} ID: {activeChat?.id.toString()}
                  </p>
                </div>
                
                <div className="w-full space-y-4 mt-4">
                  <div className="p-4 border border-hacker-green/30 bg-hacker-dark/50">
                    <p className="text-[10px] opacity-40 uppercase mb-1">About / Bio</p>
                    <p className="text-sm">
                      {profileData?.fullChat?.about || profileData?.about || "NO ADDITIONAL DATA AVAILABLE IN THIS SECTOR."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-hacker-green/30 bg-hacker-dark/50 text-center">
                      <p className="text-[10px] opacity-40 uppercase">Status</p>
                      <p className="text-xs font-bold">{activeChat?.online ? 'ACTIVE' : 'INACTIVE'}</p>
                    </div>
                    <div className="p-3 border border-hacker-green/30 bg-hacker-dark/50 text-center">
                      <p className="text-[10px] opacity-40 uppercase">Encryption</p>
                      <p className="text-xs font-bold">MTPROTO 2.0</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowProfile(false)}
                  className="w-full hacker-button mt-4"
                >
                  CLOSE PROFILE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
