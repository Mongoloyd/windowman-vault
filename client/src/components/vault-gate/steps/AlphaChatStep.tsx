/**
 * Alpha Step 5: Expert Chat
 * 
 * DESIGN PHILOSOPHY: Consultative, Not Pushy
 * - AI chat drawer for score explanations
 * - User can ask questions about their report
 * - Feels like talking to an expert, not a sales bot
 * - Builds trust before the close
 * 
 * VISUAL REQUIREMENTS:
 * - Full report display (no longer blurred)
 * - Chat drawer slides in from right
 * - Pre-populated quick questions
 * - Gemini-powered responses
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pushDL } from '@/lib/tracking';

// Import ScanResult from vault.ts
import type { ScanResult } from '@/types/vault';

interface AlphaChatStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  scanResult: ScanResult;
  onContinue: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "Why is my score low?",
  "What are the red flags?",
  "How can I save money?",
  "Is this quote fair?",
];

export function AlphaChatStep({ 
  eventId, 
  leadId, 
  firstName, 
  scanResult,
  onContinue 
}: AlphaChatStepProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting when chat opens
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const greeting: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: `Hi ${firstName}! I've analyzed your quote and found some important things to discuss. Your overall protection score is ${scanResult.overallScore}/100. What would you like to know more about?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isChatOpen, firstName, scanResult.overallScore]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Track chat interaction
    pushDL({
      event: 'alpha_chat_message',
      event_id: eventId,
      lead_id: leadId,
      question: content.trim().slice(0, 100),
    });

    // Simulate AI response (in production, this would call Gemini)
    setTimeout(() => {
      const response = generateResponse(content, scanResult);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      pushDL({
        event: 'alpha_chat_opened',
        event_id: eventId,
        lead_id: leadId,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:p-8 lg:p-10 relative"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Report Unlocked</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Your Quote Analysis, {firstName}
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Review your results below. Have questions? Chat with our AI expert.
          </p>
        </motion.div>
      </div>

      {/* Report Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 overflow-hidden">
          {/* Score Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Overall Protection Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${
                    scanResult.overallScore >= 70 ? 'text-emerald-400' :
                    scanResult.overallScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {scanResult.overallScore}
                  </span>
                  <span className="text-gray-500 text-xl">/100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Potential Savings</p>
                <p className="text-3xl font-bold text-emerald-400">
                  ${(scanResult.estimatedSavings?.low || 0).toLocaleString()} - ${(scanResult.estimatedSavings?.high || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 border-b border-white/10">
            <p className="text-gray-300 leading-relaxed">{scanResult.warnings.length > 0 ? `Found ${scanResult.warnings.length} potential issues with your quote.` : 'Your quote looks good overall.'}</p>
          </div>

          {/* Warnings */}
          {scanResult.warnings.length > 0 && (
            <div className="p-6 border-b border-white/10">
              <h4 className="flex items-center gap-2 text-red-400 font-medium mb-4">
                <AlertTriangle className="w-5 h-5" />
                Warnings ({scanResult.warnings.length})
              </h4>
              <ul className="space-y-2">
                {scanResult.warnings.slice(0, 3).map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-red-400 mt-1">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Items */}
          {scanResult.missingItems.length > 0 && (
            <div className="p-6">
              <h4 className="flex items-center gap-2 text-yellow-400 font-medium mb-4">
                <HelpCircle className="w-5 h-5" />
                Missing Items ({scanResult.missingItems.length})
              </h4>
              <ul className="space-y-2">
                {scanResult.missingItems.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-yellow-400 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto"
      >
        <Button
          onClick={toggleChat}
          variant="outline"
          className="w-full sm:w-auto border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Ask Questions
        </Button>
        <Button
          onClick={onContinue}
          className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white"
        >
          Continue to Next Steps
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 z-50 flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">AI Quote Expert</h3>
                    <p className="text-xs text-gray-400">Ask me anything about your report</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span className="text-sm text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuickQuestion(q)}
                        className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-cyan-500/30 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your quote..."
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    disabled={isTyping}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Generate contextual response based on question and scan results
 * In production, this would call Gemini API
 */
function generateResponse(question: string, scan: ScanResult): string {
  const q = question.toLowerCase();
  
  if (q.includes('score') || q.includes('low') || q.includes('why')) {
    if (scan.overallScore < 50) {
      return `Your score of ${scan.overallScore} indicates some significant concerns. The main issues are: ${scan.warnings.slice(0, 2).join(', ')}. These are common tactics that can cost homeowners thousands. Would you like me to explain any of these in detail?`;
    } else {
      return `Your score of ${scan.overallScore} is ${scan.overallScore >= 70 ? 'good' : 'moderate'}. There are still ${scan.warnings.length} areas that could be improved. The biggest opportunity is in ${scan.warnings[0] || 'the pricing structure'}.`;
    }
  }
  
  if (q.includes('red flag') || q.includes('warning')) {
    return `I found ${scan.warnings.length} red flags in your quote:\n\n${scan.warnings.slice(0, 3).map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\nThese are important to address before signing any contract.`;
  }
  
  if (q.includes('save') || q.includes('money') || q.includes('savings')) {
    const savings = scan.estimatedSavings || { low: 0, high: 0 };
    return `Based on my analysis, you could potentially save $${savings.low.toLocaleString()} to $${savings.high.toLocaleString()} by addressing the issues I found. The biggest savings opportunity is negotiating on ${scan.missingItems[0] || 'labor costs'} and ensuring all ${scan.missingItems.length} missing items are included.`;
  }
  
  if (q.includes('fair') || q.includes('good deal') || q.includes('price')) {
    if (scan.overallScore >= 70) {
      return `Overall, this quote appears to be reasonably fair. However, I'd still recommend getting 2-3 additional quotes to compare. The ${scan.missingItems.length} missing items should be clarified before signing.`;
    } else {
      return `Based on my analysis, this quote has some concerns. The ${scan.warnings.length} warnings I found suggest there's room for negotiation. I'd strongly recommend getting competing quotes before making a decision.`;
    }
  }
  
  const defaultSavings = scan.estimatedSavings || { low: 0, high: 0 };
  return `That's a great question! Based on your quote analysis, I can tell you that your protection score is ${scan.overallScore}/100 with ${scan.warnings.length} warnings and ${scan.missingItems.length} missing items. The potential savings range is $${defaultSavings.low.toLocaleString()} to $${defaultSavings.high.toLocaleString()}. Is there a specific aspect you'd like me to explain further?`;
}
