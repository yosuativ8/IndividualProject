// ChatBot Component - Floating AI chatbot
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hi! Saya Tourism Assistant. Coba tanya saya tentang destinasi di Jogja, Bali, atau kota lainnya!',
      places: null
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (!isAuthenticated) {
      alert('Please login to use chat assistant');
      navigate('/login');
      return;
    }

    const userMessage = { role: 'user', text: inputMessage, places: null };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/gemini/chat`,
        {
          message: inputMessage,
          conversationHistory: messages.slice(-5).map(m => ({ role: m.role, text: m.text }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage = {
        role: 'assistant',
        text: response.data.response || 'Maaf, saya tidak dapat memproses permintaan Anda.',
        places: response.data.places || null
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('ChatBot error:', error.response?.data || error.message);
      const errorMessage = {
        role: 'assistant',
        text: error.response?.data?.message || 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        places: null
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary rounded-circle shadow-lg"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          zIndex: 1000
        }}
      >
        <i className={`bi ${isOpen ? 'bi-x' : 'bi-robot'}`}></i>
      </button>

      {isOpen && (
        <div className="card shadow-lg" style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '380px',
          height: '500px',
          zIndex: 1000
        }}>
          <div className="card-header bg-primary text-white">
            <h6 className="mb-0"><i className="bi bi-robot me-2"></i>Tourism Assistant</h6>
          </div>

          <div className="card-body" style={{ overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
            {messages.map((msg, index) => (
              <div key={index}>
                <div className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`p-3 rounded ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white'}`}>
                    <span>{msg.text}</span>
                  </div>
                </div>
                {msg.places && msg.places.length > 0 && (
                  <div className="mb-3">
                    {msg.places.map((place, idx) => (
                      <div key={idx} className="card mb-2" onClick={() => { navigate(`/place/${place.id}`); setIsOpen(false); }}>
                        <div className="card-body p-2">
                          <h6>{place.name}</h6>
                          <small><i className="bi bi-geo-alt-fill"></i> {place.location}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && <div className="text-center"><span>Thinking...</span></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                className="form-control"
                placeholder="Tanya tentang destinasi..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
