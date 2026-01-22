import { useState } from 'react';
import { useEventDraft, useEventDraftActions } from '../../../state/eventState';
import type { CustomQuestion } from '../../../types/event';

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'radio', label: 'Single Choice', icon: '⭕' },
  { value: 'checkbox', label: 'Multiple Choice', icon: '☑️' },
] as const;

const QUESTION_TEMPLATES = [
  { question: 'How did you hear about this event?', type: 'select' as const, options: ['Social Media', 'Friend', 'Email', 'Website', 'Other'] },
  { question: 'Do you have any dietary restrictions?', type: 'select' as const, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'] },
  { question: 'Emergency contact name and number', type: 'text' as const },
  { question: 'T-shirt size', type: 'select' as const, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { question: 'Any special requirements?', type: 'textarea' as const },
];

export function CustomQuestionsInput() {
  const draft = useEventDraft();
  const { updateDraft } = useEventDraftActions();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const questions = draft.customQuestions ?? [];

  async function addQuestion(template?: typeof QUESTION_TEMPLATES[0]) {
    const newQuestion: CustomQuestion = {
      id: generateId(),
      question: template?.question || '',
      type: template?.type || 'text',
      options: template?.options || [],
      required: false,
    };
    await updateDraft({ customQuestions: [...questions, newQuestion] });
  }

  async function updateQuestion(questionId: string, updates: Partial<CustomQuestion>) {
    const updated = questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    await updateDraft({ customQuestions: updated });
  }

  async function removeQuestion(questionId: string) {
    const updated = questions.filter(q => q.id !== questionId);
    await updateDraft({ customQuestions: updated });
  }

  async function addOption(questionId: string) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      await updateQuestion(questionId, { options: [...(question.options || []), ''] });
    }
  }

  async function updateOption(questionId: string, optionIndex: number, value: string) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...(question.options || [])];
      newOptions[optionIndex] = value;
      await updateQuestion(questionId, { options: newOptions });
    }
  }

  async function removeOption(questionId: string, optionIndex: number) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
      await updateQuestion(questionId, { options: newOptions });
    }
  }

  const needsOptions = (type: string) => ['select', 'radio', 'checkbox'].includes(type);

  return (
    <div className="rounded-2xl bg-[#252525]/40 backdrop-blur-md border border-[#9C9C9C]/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">❓</span>
          <div className="text-left">
            <p className="text-white font-medium">Custom Questions</p>
            <p className="text-white/50 text-sm">
              {questions.length > 0 
                ? `${questions.length} question${questions.length !== 1 ? 's' : ''}`
                : 'Ask attendees for info'}
            </p>
          </div>
        </div>
        <span className={`text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          
          {/* Questions List */}
          {questions.length > 0 && (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div 
                  key={question.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <span className="text-white/50 text-sm font-medium mt-2">Q{index + 1}</span>
                    
                    <div className="flex-1 space-y-3">
                      {/* Question Text */}
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        placeholder="Enter your question..."
                        className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      
                      {/* Type & Required */}
                      <div className="flex items-center gap-3">
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(question.id, { type: e.target.value as CustomQuestion['type'] })}
                          className="px-3 py-2 bg-white/10 rounded-lg text-white text-sm outline-none cursor-pointer"
                        >
                          {QUESTION_TYPES.map(type => (
                            <option key={type.value} value={type.value} className="bg-zinc-800">
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-white/30"
                          />
                          <span className="text-white/60 text-sm">Required</span>
                        </label>
                      </div>

                      {/* Options (for select/radio/checkbox) */}
                      {needsOptions(question.type) && (
                        <div className="space-y-2 pl-4 border-l-2 border-white/10">
                          <p className="text-white/50 text-xs">Options:</p>
                          {(question.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <span className="text-white/30 text-sm">•</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                placeholder="Option..."
                                className="flex-1 px-2 py-1 bg-white/5 rounded text-white text-sm placeholder-white/30 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(question.id, optionIndex)}
                                className="text-white/30 hover:text-red-400 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(question.id)}
                            className="text-purple-400 text-sm hover:text-purple-300"
                          >
                            + Add option
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => addQuestion()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-white/50 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
            >
              + Add Custom Question
            </button>

            {/* Quick Add Templates */}
            {questions.length < 5 && (
              <div className="space-y-2">
                <p className="text-white/40 text-xs">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TEMPLATES.filter(t => 
                    !questions.some(q => q.question === t.question)
                  ).slice(0, 3).map((template) => (
                    <button
                      key={template.question}
                      type="button"
                      onClick={() => addQuestion(template)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-colors truncate max-w-[200px]"
                    >
                      {template.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
