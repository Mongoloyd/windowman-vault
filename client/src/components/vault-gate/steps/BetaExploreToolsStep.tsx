/**
 * Beta Step 3: Explore Tools (THE LIBRARY)
 * 
 * DESIGN PHILOSOPHY: Self-Guided Exploration
 * - 4 educational tool boxes
 * - Feels like browsing a library, not being sold
 * - Each tool provides genuine value
 * - User self-selects what interests them
 * 
 * TOOLS:
 * 1. Price Calculator - "What should windows cost?"
 * 2. Red Flag Checklist - "What to watch for in quotes"
 * 3. Warranty Guide - "Understanding window warranties"
 * 4. Contractor Questions - "Questions to ask before signing"
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  AlertTriangle, 
  Shield, 
  HelpCircle,
  ArrowRight,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pushDL } from '@/lib/tracking';
import { trpc } from '@/lib/trpc';

interface BetaExploreToolsStepProps {
  eventId: string;
  leadId: string;
  firstName: string;
  onContinue: () => void;
}

// Tool IDs must match the beta router enum: quote_scanner, savings_calculator, protection_vault, knowledge_library
const TOOLS = [
  {
    id: 'quote_scanner' as const,
    icon: Calculator,
    title: 'Quote Scanner',
    subtitle: 'Already have a quote? Get it analyzed.',
    description: 'Upload your contractor quote and get instant AI analysis.',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    redirectsToAlpha: true,
  },
  {
    id: 'savings_calculator' as const,
    icon: AlertTriangle,
    title: 'Savings Calculator',
    subtitle: 'What should windows cost in your area?',
    description: 'Get instant estimates based on window type, size, and your ZIP code.',
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    redirectsToAlpha: false,
  },
  {
    id: 'protection_vault' as const,
    icon: Shield,
    title: 'Protection Vault',
    subtitle: 'Access exclusive homeowner resources',
    description: 'Checklists, guides, and tools to protect your investment.',
    color: 'purple',
    gradient: 'from-purple-500/20 to-pink-500/20',
    redirectsToAlpha: false,
  },
  {
    id: 'knowledge_library' as const,
    icon: HelpCircle,
    title: 'Knowledge Library',
    subtitle: 'Learn before you buy',
    description: 'Expert guides on warranties, red flags, and contractor questions.',
    color: 'yellow',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    redirectsToAlpha: false,
  },
];

export function BetaExploreToolsStep({ 
  eventId, 
  leadId, 
  firstName,
  onContinue 
}: BetaExploreToolsStepProps) {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const selectToolMutation = trpc.beta.selectTool.useMutation();

  const handleToolClick = async (toolId: 'quote_scanner' | 'savings_calculator' | 'protection_vault' | 'knowledge_library') => {
    // Toggle selection
    const isSelected = selectedTools.includes(toolId);
    
    if (!isSelected) {
      setSelectedTools([...selectedTools, toolId]);
      setExpandedTool(toolId);

      // Track tool selection
      try {
        await selectToolMutation.mutateAsync({
          leadId,
          tool: toolId,
        });
      } catch (error) {
        console.error('[BetaTools] Select tool error:', error);
      }

      pushDL({
        event: 'beta_tool_selected',
        event_id: eventId,
        lead_id: leadId,
        tool: toolId,
        tools_selected_count: selectedTools.length + 1,
      });
    } else {
      setExpandedTool(expandedTool === toolId ? null : toolId);
    }
  };

  const handleContinue = () => {
    pushDL({
      event: 'beta_tools_completed',
      event_id: eventId,
      lead_id: leadId,
      tools_selected: selectedTools,
      tools_count: selectedTools.length,
    });
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-8 lg:p-10"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Free Protection Tools</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Explore Our Tools, {firstName}
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Select any tools that interest you. No pressure, just helpful resources.
          </p>
        </motion.div>
      </div>

      {/* Tool Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8">
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          const isSelected = selectedTools.includes(tool.id);
          const isExpanded = expandedTool === tool.id;
          
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => handleToolClick(tool.id)}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-300 ${
                  isSelected
                    ? `border-${tool.color}-400 bg-gradient-to-br ${tool.gradient}`
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${tool.color}-500/20 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 text-${tool.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold">{tool.title}</h3>
                      {isSelected && (
                        <CheckCircle className={`w-5 h-5 text-${tool.color}-400 flex-shrink-0`} />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{tool.subtitle}</p>
                    
                    {/* Expanded Description */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: isExpanded ? 'auto' : 0,
                        opacity: isExpanded ? 1 : 0 
                      }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-gray-300 pt-2 border-t border-white/10">
                        {tool.description}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // In production, this would open the tool
                          pushDL({
                            event: 'beta_tool_opened',
                            event_id: eventId,
                            lead_id: leadId,
                            tool: tool.id,
                          });
                        }}
                        className={`mt-3 flex items-center gap-2 text-sm text-${tool.color}-400 hover:text-${tool.color}-300`}
                      >
                        <span>Open Tool</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </motion.div>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={handleContinue}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
        >
          {selectedTools.length > 0 ? 'Continue' : 'Skip for Now'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        {selectedTools.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            {selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
