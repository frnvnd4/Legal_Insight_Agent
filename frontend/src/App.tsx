import { useState, useRef, useEffect } from 'react';
import { uploadContract } from './services/uploadContract';
import { chatWithAgent } from './services/chatWithAgent';
import ReactMarkdown from 'react-markdown';

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const processFile = async (selectedFile: File) => {
    setLoading(true);
    //setStatus('Cargando documento...');
    
    try {
      const data = await uploadContract(selectedFile);
      if (data && data.session_id) {
        setSessionId(data.session_id);
        setMessages([{ 
          role: 'assistant', 
          content: `**Nuevo contrato cargado:** *${selectedFile.name}*.\n\nHe indexado las cláusulas. ¿En qué puedo ayudarte?` 
        }]);
        setStatus('');
      }
    } catch (err) {
      setStatus('Error al procesar el nuevo documento');
    } finally {
      setLoading(false);
    }
  };

  const onChat = async (e: any) => {
    e.preventDefault();
    const q = e.target.question.value;
    if (!q || !sessionId) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    e.target.reset();
    setLoading(true);

    try {
      const data = await chatWithAgent(q, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Hubo un problema al consultar al agente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-brand-surface p-4 md:p-10 font-sans">
    <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-brand-border flex flex-col h-[85vh]">
      <div className="bg-brand-dark p-6 text-white flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Legal Insight <span className="text-brand-accent">Agent</span></h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Technical Test</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
        {!sessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-2xl bg-brand-surface/50 m-4">
            <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-brand-border">
              <svg 
                className="w-16 h-16 text-brand-primary" 
                aria-hidden="true" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M5 12V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4m5-13v4a1 1 0 0 1-1 1H5m0 6h9m0 0-2-2m2 2-2 2"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-brand-dark mb-2">Análisis Inteligente de Contratos</h2>
            <p className="text-slate-500 mb-10 text-center max-w-md">
              Sube tu documento en PDF para extraer la información y ayudarte con lo que necesites.
            </p>
            
            <label className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white px-10 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-blue-200 active:scale-95 text-lg">
              {loading ? 'Procesando archivo...' : 'Comenzar ahora'}
              <input type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} hidden disabled={loading} />
            </label>
            {status && <p className="mt-6 text-brand-primary font-medium animate-pulse">{status}</p>}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-base shadow-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-none' 
                      : 'bg-brand-chat text-slate-800 rounded-tl-none border border-brand-border'
                  }`}>
                    <div className="prose prose-slate max-w-none">
                       <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  Estoy analizando el contrato...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={onChat} className="flex items-center gap-4 pt-6 border-t border-brand-border/50">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 text-slate-400 hover:text-brand-primary hover:bg-brand-accent/10 rounded-2xl transition-all border border-transparent hover:border-brand-accent/20"
                title="Cambiar contrato"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              <input type="file" ref={fileInputRef} accept=".pdf" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />

              <input 
                name="question" 
                autoComplete="off"
                placeholder="Escribe tu consulta sobre el contrato aquí..." 
                className="flex-1 bg-brand-surface border border-brand-border rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white transition-all shadow-inner" 
              />
              
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-brand-dark text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg"
              >
                Consultar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
    <p className="mt-8 text-slate-400 text-xs font-medium uppercase tracking-widest">Legal Analysis System</p>
  </div>
);;
}

export default App;