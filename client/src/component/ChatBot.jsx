/**
 * ChatBot Component - Floating AI Assistant
 * 
 * Fitur:
 * - Chat dengan AI untuk rekomendasi destinasi wisata
 * - Powered by Google Gemini AI
 * - Auto-fetch nearby places berdasarkan chat response
 * - Dispatch results ke Redux dan trigger map view di Home
 * - Conversation history untuk context-aware responses
 * - Requires authentication
 * 
 * @component
 */
import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setPlacesFromChatbot } from '../store/slices/placesSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ChatBot() {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi! Saya Tourism Assistant. Coba tanya saya tentang destinasi di Jogja, Bali, atau kota lainnya!`,
      places: null
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = localStorage.getItem('token');

  // Auto-scroll ke bottom saat ada message baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle send message ke AI
   * - Check authentication
   * - Send message + conversation history ke backend
   * - Parse response untuk places data
   * - Dispatch places ke Redux jika ada results
   */
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

      console.log('ChatBot received response:', response.data);
      console.log('Places:', response.data.places);
      console.log('MapCenter:', response.data.mapCenter);

      const aiMessage = {
        role: 'assistant',
        text: response.data.response || 'Maaf, saya tidak dapat memproses permintaan Anda.',
        places: response.data.places || null
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Dispatch ke Redux untuk update nearbyPlaces dan mapCenter
      if (response.data.places && response.data.places.length > 0) {
        console.log('Dispatching to Redux:', {
          placesCount: response.data.places.length,
          mapCenter: response.data.mapCenter
        });
        
        dispatch(setPlacesFromChatbot({
          places: response.data.places,
          mapCenter: response.data.mapCenter
        }));
        
        console.log('Redux dispatch completed');
      } else {
        console.log('No places to dispatch:', response.data.places);
      }
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
                  <div className={`p-3 rounded ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '85%' }}>
                    <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                  </div>
                </div>
                {msg.places && msg.places.length > 0 && (
                  <div className="alert alert-success mb-3" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <strong>{msg.places.length} destinasi ditemukan!</strong>
                    <br />
                    <small>Scroll ke bawah untuk melihat hasil pencarian di card list 👇</small>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-center mb-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <small className="d-block mt-2 text-muted">Thinking...</small>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer">
            <form onSubmit={handleSendMessage}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tanya tentang destinasi..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
