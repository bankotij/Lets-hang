import { useState, useEffect, useMemo } from 'react';
import { useUser, useIsLoggedIn, useAuthActions, PLATFORM_FEE_PERCENT } from '../state/authState';
import { eventApi } from '../api/eventApi';
import { paymentApi, openRazorpayCheckout } from '../api/paymentApi';
import type { LiveEvent, TicketTier, QuestionResponse, PlusOne, AttendeeAddOn } from '../types/event';
import { formatPrice, formatMoney, formatUSD, getUserCurrency, convertFromUSD } from '../utils/currency';

type JoinEventModalProps = {
  event: LiveEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type Step = 'tier' | 'addons' | 'questions' | 'plusones' | 'group' | 'summary' | 'processing' | 'success' | 'error';

export function JoinEventModal({ event, isOpen, onClose, onSuccess }: JoinEventModalProps) {
  const user = useUser();
  const isLoggedIn = useIsLoggedIn();
  const { openLoginModal } = useAuthActions();
  
  const [step, setStep] = useState<Step>('tier');
  const [error, setError] = useState<string | null>(null);
  const [isPaymentConfigured, setIsPaymentConfigured] = useState<boolean | null>(null);
  
  // Selection state
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Map<string, number>>(new Map());
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [plusOnes, setPlusOnes] = useState<PlusOne[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>(['']);
  
  // Password/Invite code for protected events
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredInviteCode, setEnteredInviteCode] = useState('');
  const [accessGranted, setAccessGranted] = useState(false);

  const hasMultipleTiers = event.hasMultipleTiers && event.ticketTiers && event.ticketTiers.length > 0;
  const hasAddOns = event.addOns && event.addOns.length > 0;
  const hasQuestions = event.customQuestions && event.customQuestions.length > 0;
  const allowsPlusOnes = event.allowPlusOnes;
  const allowsGroupReg = event.allowGroupRegistration;
  
  const isPrivate = event.privacyType === 'private' || event.isPrivate;
  const isInviteOnly = event.privacyType === 'invite-only';
  const isPasswordProtected = event.privacyType === 'password';
  
  // Calculate remaining capacity
  const currentAttendees = event.attendees?.reduce((sum, a) => sum + (a.ticketCount || 1), 0) || event.attendeeCount || 0;
  const totalCapacity = hasMultipleTiers 
    ? event.ticketTiers?.reduce((sum, t) => sum + t.quantity, 0) || event.capacity || 50
    : event.capacity || 50;
  const remainingCapacity = totalCapacity - currentAttendees;
  const maxTickets = Math.min(10, remainingCapacity);

  // Calculate pricing
  const pricing = useMemo(() => {
    const tierPrice = hasMultipleTiers && selectedTier 
      ? selectedTier.price * ticketCount 
      : event.costPerPerson * ticketCount;
    
    const addOnsPrice = Array.from(selectedAddOns.entries()).reduce((sum, [id, qty]) => {
      const addOn = event.addOns?.find(a => a.id === id);
      return sum + (addOn ? addOn.price * qty : 0);
    }, 0);
    
    const plusOnesPrice = plusOnes.length * (event.plusOneCost || 0);
    
    let groupDiscount = 0;
    if (allowsGroupReg && groupMembers.length >= (event.minGroupSize || 2)) {
      groupDiscount = Math.round(tierPrice * (event.groupDiscount || 0) / 100);
    }
    
    const subtotal = tierPrice + addOnsPrice + plusOnesPrice - groupDiscount;
    return { tierPrice, addOnsPrice, plusOnesPrice, groupDiscount, subtotal };
  }, [selectedTier, ticketCount, selectedAddOns, plusOnes, groupMembers, event, hasMultipleTiers, allowsGroupReg]);

  const isFree = pricing.subtotal === 0;
  // Convert USD cents to local currency smallest unit (paise for INR, cents for USD, etc.)
  const localCurrency = getUserCurrency();
  const amountInSmallestUnit = convertFromUSD(pricing.subtotal);

  // Check payment config on mount
  useEffect(() => {
    async function checkPaymentConfig() {
      const result = await paymentApi.getConfig();
      if (result.success && result.data) {
        setIsPaymentConfigured(result.data.configured);
      }
    }
    if (isOpen) {
      checkPaymentConfig();
      resetModal();
      
      // Auto-select first tier if only one
      if (hasMultipleTiers && event.ticketTiers?.length === 1) {
        setSelectedTier(event.ticketTiers[0]);
      }
      
      // Determine initial step based on event config
      determineInitialStep();
    }
  }, [isOpen]);

  function determineInitialStep() {
    // Check access first for protected events
    if ((isInviteOnly || isPasswordProtected) && !accessGranted) {
      // Access check is done in render
    }
    
    if (hasMultipleTiers) {
      setStep('tier');
    } else if (hasAddOns) {
      setStep('addons');
    } else if (hasQuestions) {
      setStep('questions');
    } else if (allowsPlusOnes) {
      setStep('plusones');
    } else if (allowsGroupReg) {
      setStep('group');
    } else {
      setStep('summary');
    }
  }

  function getNextStep(current: Step): Step {
    const steps: Step[] = [];
    if (hasMultipleTiers) steps.push('tier');
    if (hasAddOns) steps.push('addons');
    if (hasQuestions) steps.push('questions');
    if (allowsPlusOnes) steps.push('plusones');
    if (allowsGroupReg) steps.push('group');
    steps.push('summary');
    
    const currentIndex = steps.indexOf(current);
    return steps[currentIndex + 1] || 'summary';
  }

  function getPrevStep(current: Step): Step | null {
    const steps: Step[] = [];
    if (hasMultipleTiers) steps.push('tier');
    if (hasAddOns) steps.push('addons');
    if (hasQuestions) steps.push('questions');
    if (allowsPlusOnes) steps.push('plusones');
    if (allowsGroupReg) steps.push('group');
    steps.push('summary');
    
    const currentIndex = steps.indexOf(current);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  }

  function resetModal() {
    setStep('tier');
    setError(null);
    setSelectedTier(null);
    setTicketCount(1);
    setSelectedAddOns(new Map());
    setResponses([]);
    setPlusOnes([]);
    setGroupName('');
    setGroupMembers(['']);
    setEnteredPassword('');
    setEnteredInviteCode('');
    setAccessGranted(false);
  }

  function handleTierSelect(tier: TicketTier) {
    setSelectedTier(tier);
  }

  function handleAddOnToggle(addOnId: string) {
    const newMap = new Map(selectedAddOns);
    if (newMap.has(addOnId)) {
      newMap.delete(addOnId);
    } else {
      newMap.set(addOnId, 1);
    }
    setSelectedAddOns(newMap);
  }

  function handleAddOnQtyChange(addOnId: string, qty: number) {
    const newMap = new Map(selectedAddOns);
    if (qty <= 0) {
      newMap.delete(addOnId);
    } else {
      newMap.set(addOnId, qty);
    }
    setSelectedAddOns(newMap);
  }

  function handleQuestionChange(questionId: string, question: string, answer: string) {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, question, answer };
        return updated;
      }
      return [...prev, { questionId, question, answer }];
    });
  }

  function addPlusOne() {
    if (plusOnes.length < (event.maxPlusOnes || 1)) {
      setPlusOnes([...plusOnes, { name: '', email: '' }]);
    }
  }

  function updatePlusOne(index: number, field: 'name' | 'email', value: string) {
    const updated = [...plusOnes];
    updated[index] = { ...updated[index], [field]: value };
    setPlusOnes(updated);
  }

  function removePlusOne(index: number) {
    setPlusOnes(plusOnes.filter((_, i) => i !== index));
  }

  function addGroupMember() {
    if (groupMembers.length < (event.maxGroupSize || 10)) {
      setGroupMembers([...groupMembers, '']);
    }
  }

  function updateGroupMember(index: number, value: string) {
    const updated = [...groupMembers];
    updated[index] = value;
    setGroupMembers(updated);
  }

  function removeGroupMember(index: number) {
    setGroupMembers(groupMembers.filter((_, i) => i !== index));
  }

  async function handleJoinEvent() {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    if (!user) return;

    if (isFree) {
      await processJoin();
    } else {
      await initiatePayment();
    }
  }

  async function initiatePayment() {
    if (!user) return;
    
    setStep('processing');
    setError(null);

    try {
      if (!isPaymentConfigured) {
        setError('Payment gateway not configured. Using demo mode.');
        await new Promise(r => setTimeout(r, 1500));
        await processJoin();
        return;
      }

      const tierName = selectedTier?.name || 'General';
      const orderResult = await paymentApi.createOrder(
        amountInSmallestUnit,
        event.id,
        `${event.name} - ${tierName} (${ticketCount} ticket${ticketCount > 1 ? 's' : ''})`,
        localCurrency.code
      );

      if (!orderResult.success || !orderResult.data) {
        throw new Error(orderResult.error || 'Failed to create payment order');
      }

      const { order, key } = orderResult.data;

      openRazorpayCheckout({
        key,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        eventName: event.name,
        userName: user.name,
        userEmail: user.email,
        onSuccess: async (response) => {
          const verifyResult = await paymentApi.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            event.id
          );

          if (verifyResult.success) {
            await processJoin(response.razorpay_payment_id);
          } else {
            setError('Payment verification failed. Please contact support.');
            setStep('error');
          }
        },
        onError: (err) => {
          setError(err);
          setStep('error');
        },
        onDismiss: () => {
          setStep('summary');
        },
      });

      setStep('summary');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
    }
  }

  async function processJoin(paymentId?: string) {
    if (!user) return;

    setStep('processing');

    try {
      // Prepare add-ons data
      const attendeeAddOns: AttendeeAddOn[] = Array.from(selectedAddOns.entries()).map(([id, qty]) => {
        const addOn = event.addOns?.find(a => a.id === id);
        return {
          addOnId: id,
          name: addOn?.name || '',
          quantity: qty,
          price: addOn?.price || 0,
        };
      });

      if (isPrivate) {
        const result = await eventApi.requestToJoin(event.id, {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        }, pricing.subtotal, paymentId);

        if (!result.ok) {
          throw new Error(result.error);
        }
      } else {
        const result = await eventApi.joinEvent(event.id, {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        }, pricing.subtotal, paymentId, ticketCount);

        if (!result.ok) {
          throw new Error(result.error);
        }

        // Send ticket email
        try {
          await paymentApi.sendTicket({
            eventId: event.id,
            eventName: event.name,
            eventDescription: event.description,
            eventDate: event.date || event.dateTime || '',
            eventLocation: event.location,
            paymentId,
            amount: pricing.subtotal,
            ticketCount,
            hostName: event.hostName,
            hostEmail: event.hostEmail,
            ticketTierName: selectedTier?.name,
          });
        } catch (ticketErr) {
          console.error('Failed to send ticket email:', ticketErr);
        }
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        resetModal();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    }
  }

  function handleVerifyAccess() {
    if (isPasswordProtected && enteredPassword === event.eventPassword) {
      setAccessGranted(true);
      determineInitialStep();
    } else if (isInviteOnly && enteredInviteCode.toUpperCase() === event.inviteCode) {
      setAccessGranted(true);
      determineInitialStep();
    } else {
      setError(isPasswordProtected ? 'Incorrect password' : 'Invalid invite code');
    }
  }

  if (!isOpen) return null;

  // Access gate for protected events
  if ((isInviteOnly || isPasswordProtected) && !accessGranted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-zinc-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            ✕
          </button>
          
          <div className="text-center mb-6">
            <span className="text-4xl mb-4 block">{isPasswordProtected ? '🔑' : '✉️'}</span>
            <h3 className="text-white font-bold text-xl">{isPasswordProtected ? 'Password Required' : 'Invite Only'}</h3>
            <p className="text-white/50 text-sm mt-2">
              {isPasswordProtected 
                ? 'Enter the event password to continue'
                : 'Enter your invite code to access this event'}
            </p>
          </div>

          <input
            type={isPasswordProtected ? 'password' : 'text'}
            value={isPasswordProtected ? enteredPassword : enteredInviteCode}
            onChange={(e) => isPasswordProtected 
              ? setEnteredPassword(e.target.value) 
              : setEnteredInviteCode(e.target.value.toUpperCase())}
            placeholder={isPasswordProtected ? 'Enter password...' : 'Enter invite code...'}
            className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder-white/40 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-purple-500"
          />

          {error && (
            <p className="text-red-400 text-sm text-center mt-3">{error}</p>
          )}

          <button
            type="button"
            onClick={handleVerifyAccess}
            className="w-full mt-4 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative h-24 overflow-hidden flex-shrink-0">
          {event.flyerUrl ? (
            <img src={event.flyerUrl} alt={event.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-600 to-pink-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white"
          >
            ✕
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-white font-bold truncate">{event.name}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Tier Selection */}
          {step === 'tier' && hasMultipleTiers && (
            <>
              <h4 className="text-white font-semibold mb-4">Select Ticket Type</h4>
              <div className="space-y-3">
                {event.ticketTiers?.map((tier) => {
                  const isSoldOut = tier.sold >= tier.quantity;
                  const isSelected = selectedTier?.id === tier.id;
                  
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => !isSoldOut && handleTierSelect(tier)}
                      disabled={isSoldOut}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isSoldOut 
                          ? 'bg-white/5 opacity-50 cursor-not-allowed'
                          : isSelected
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                      style={{ borderLeftColor: tier.color, borderLeftWidth: 4 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tier.emoji}</span>
                          <span className="text-white font-semibold">{tier.name}</span>
                          {isSelected && <span className="text-purple-400">✓</span>}
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatPrice(tier.price)}</p>
                          <p className="text-white/40 text-xs">{tier.quantity - tier.sold} left</p>
                        </div>
                      </div>
                      {tier.perks.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tier.perks.map((perk, i) => (
                            <span key={i} className="text-white/50 text-xs">✓ {perk}</span>
                          ))}
                        </div>
                      )}
                      {isSoldOut && <p className="text-red-400 text-xs mt-1">Sold Out</p>}
                    </button>
                  );
                })}
              </div>

              {/* Ticket quantity */}
              {selectedTier && !isPrivate && (
                <div className="mt-4 bg-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Number of tickets</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                        className="w-8 h-8 rounded-full bg-white/10 text-white font-bold hover:bg-white/20"
                      >
                        −
                      </button>
                      <span className="text-white font-bold text-xl w-8 text-center">{ticketCount}</span>
                      <button
                        type="button"
                        onClick={() => setTicketCount(Math.min(maxTickets, ticketCount + 1))}
                        className="w-8 h-8 rounded-full bg-white/10 text-white font-bold hover:bg-white/20"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Add-ons */}
          {step === 'addons' && hasAddOns && (
            <>
              <h4 className="text-white font-semibold mb-4">Add-ons (Optional)</h4>
              <div className="space-y-3">
                {event.addOns?.map((addOn) => {
                  const isSelected = selectedAddOns.has(addOn.id);
                  const qty = selectedAddOns.get(addOn.id) || 0;
                  const isSoldOut = addOn.quantity !== undefined && addOn.sold >= addOn.quantity;
                  
                  return (
                    <div
                      key={addOn.id}
                      className={`p-4 rounded-xl transition-all ${
                        isSoldOut ? 'bg-white/5 opacity-50' : isSelected ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{addOn.emoji}</span>
                          <div>
                            <p className="text-white font-medium">{addOn.name}</p>
                            {addOn.description && <p className="text-white/40 text-xs">{addOn.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-semibold">{formatPrice(addOn.price)}</span>
                          {!isSoldOut && (
                            isSelected ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddOnQtyChange(addOn.id, qty - 1)}
                                  className="w-6 h-6 rounded bg-white/10 text-white text-sm"
                                >
                                  −
                                </button>
                                <span className="text-white w-6 text-center">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddOnQtyChange(addOn.id, qty + 1)}
                                  className="w-6 h-6 rounded bg-white/10 text-white text-sm"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddOnToggle(addOn.id)}
                                className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30"
                              >
                                Add
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Step: Custom Questions */}
          {step === 'questions' && hasQuestions && (
            <>
              <h4 className="text-white font-semibold mb-4">A Few Questions</h4>
              <div className="space-y-4">
                {event.customQuestions?.map((q) => {
                  const response = responses.find(r => r.questionId === q.id);
                  
                  return (
                    <div key={q.id}>
                      <label className="block text-white/80 text-sm mb-2">
                        {q.question}
                        {q.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      
                      {q.type === 'text' && (
                        <input
                          type="text"
                          value={response?.answer || ''}
                          onChange={(e) => handleQuestionChange(q.id, q.question, e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      )}
                      
                      {q.type === 'textarea' && (
                        <textarea
                          value={response?.answer || ''}
                          onChange={(e) => handleQuestionChange(q.id, q.question, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 bg-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                        />
                      )}
                      
                      {q.type === 'select' && (
                        <select
                          value={response?.answer || ''}
                          onChange={(e) => handleQuestionChange(q.id, q.question, e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 rounded-lg text-white outline-none cursor-pointer"
                        >
                          <option value="" className="bg-zinc-800">Select...</option>
                          {q.options?.map((opt) => (
                            <option key={opt} value={opt} className="bg-zinc-800">{opt}</option>
                          ))}
                        </select>
                      )}
                      
                      {q.type === 'radio' && (
                        <div className="space-y-2">
                          {q.options?.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={q.id}
                                checked={response?.answer === opt}
                                onChange={() => handleQuestionChange(q.id, q.question, opt)}
                                className="w-4 h-4"
                              />
                              <span className="text-white/70">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {q.type === 'checkbox' && (
                        <div className="space-y-2">
                          {q.options?.map((opt) => {
                            const selected = (response?.answer || '').split(',').includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    const current = (response?.answer || '').split(',').filter(Boolean);
                                    const updated = e.target.checked 
                                      ? [...current, opt] 
                                      : current.filter(c => c !== opt);
                                    handleQuestionChange(q.id, q.question, updated.join(','));
                                  }}
                                  className="w-4 h-4 rounded"
                                />
                                <span className="text-white/70">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Step: Plus-Ones */}
          {step === 'plusones' && allowsPlusOnes && (
            <>
              <h4 className="text-white font-semibold mb-2">Bringing Anyone? (Optional)</h4>
              <p className="text-white/50 text-sm mb-4">
                You can bring up to {event.maxPlusOnes || 1} guest{(event.maxPlusOnes || 1) > 1 ? 's' : ''}
                {(event.plusOneCost || 0) > 0 && ` (+${formatPrice(event.plusOneCost || 0)} each)`}
              </p>
              
              <div className="space-y-3">
                {plusOnes.map((po, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={po.name}
                      onChange={(e) => updatePlusOne(index, 'name', e.target.value)}
                      placeholder="Guest name"
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 outline-none"
                    />
                    <input
                      type="email"
                      value={po.email || ''}
                      onChange={(e) => updatePlusOne(index, 'email', e.target.value)}
                      placeholder="Email (optional)"
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePlusOne(index)}
                      className="px-3 text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {plusOnes.length < (event.maxPlusOnes || 1) && (
                  <button
                    type="button"
                    onClick={addPlusOne}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-white/20 text-white/50 hover:border-purple-500/50 hover:text-purple-400"
                  >
                    + Add Guest
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step: Group Registration */}
          {step === 'group' && allowsGroupReg && (
            <>
              <h4 className="text-white font-semibold mb-2">Group Registration (Optional)</h4>
              <p className="text-white/50 text-sm mb-4">
                Register as a group ({event.minGroupSize}-{event.maxGroupSize} members)
                {(event.groupDiscount || 0) > 0 && ` and get ${event.groupDiscount}% off!`}
              </p>
              
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Team/Group name"
                className="w-full px-4 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 outline-none mb-4"
              />
              
              <p className="text-white/50 text-sm mb-2">Group members:</p>
              <div className="space-y-2">
                {groupMembers.map((member, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => updateGroupMember(index, e.target.value)}
                      placeholder={index === 0 ? 'Your name' : `Member ${index + 1} name`}
                      className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/40 outline-none"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeGroupMember(index)}
                        className="px-3 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {groupMembers.length < (event.maxGroupSize || 10) && (
                  <button
                    type="button"
                    onClick={addGroupMember}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-white/20 text-white/50 hover:border-purple-500/50 hover:text-purple-400"
                  >
                    + Add Member
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step: Summary */}
          {step === 'summary' && (
            <>
              <h4 className="text-white font-semibold mb-4">Order Summary</h4>
              
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                {/* Ticket */}
                <div className="flex justify-between">
                  <span className="text-white/70">
                    {selectedTier ? `${selectedTier.emoji} ${selectedTier.name}` : 'Entry'}
                    {ticketCount > 1 && ` × ${ticketCount}`}
                  </span>
                  <span className="text-white">{formatPrice(pricing.tierPrice)}</span>
                </div>
                
                {/* Add-ons */}
                {pricing.addOnsPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Add-ons</span>
                    <span className="text-white">{formatMoney(pricing.addOnsPrice)}</span>
                  </div>
                )}
                
                {/* Plus-ones */}
                {pricing.plusOnesPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Plus-ones × {plusOnes.length}</span>
                    <span className="text-white">{formatMoney(pricing.plusOnesPrice)}</span>
                  </div>
                )}
                
                {/* Group discount */}
                {pricing.groupDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Group Discount</span>
                    <span>-{formatMoney(pricing.groupDiscount)}</span>
                  </div>
                )}
                
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-white font-bold text-lg">
                      {formatPrice(pricing.subtotal)}
                    </span>
                    {!isFree && (
                      <span className="text-white/40 text-xs block">
                        ({formatUSD(pricing.subtotal)})
                      </span>
                    )}
                  </div>
                </div>
                
                {!isFree && (
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <p className="text-purple-300 text-xs">
                      💡 {PLATFORM_FEE_PERCENT}% platform fee included
                    </p>
                  </div>
                )}
              </div>

              {/* Privacy notice */}
              <div className="flex items-center gap-2 mt-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPrivate
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {isPrivate ? '🔒 Request to Join' : '🌐 Instant Access'}
                </span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h4 className="text-white font-semibold mb-2">Processing...</h4>
              <p className="text-white/50 text-sm">Please wait a moment</p>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-4xl">
                ✅
              </div>
              <h4 className="text-white font-semibold mb-2">
                {isPrivate ? 'Request Sent!' : ticketCount > 1 ? `${ticketCount} Tickets Confirmed!` : "You're In!"}
              </h4>
              <p className="text-white/50 text-sm">
                {isPrivate
                  ? "The host will review your request."
                  : "Check your email for the ticket!"}
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">
                ❌
              </div>
              <h4 className="text-white font-semibold mb-2">Something Went Wrong</h4>
              <p className="text-white/50 text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={() => setStep('summary')}
                className="px-6 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {!['processing', 'success', 'error'].includes(step) && (
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-zinc-900/95">
            <div className="flex gap-3">
              {getPrevStep(step) && (
                <button
                  type="button"
                  onClick={() => setStep(getPrevStep(step)!)}
                  className="px-4 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20"
                >
                  Back
                </button>
              )}
              
              {step === 'summary' ? (
                <button
                  type="button"
                  onClick={handleJoinEvent}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
                >
                  {!isLoggedIn
                    ? 'Sign in to continue'
                    : isFree
                      ? isPrivate ? 'Request to Join' : 'Join Event'
                      : `Pay ${formatPrice(pricing.subtotal)}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(getNextStep(step))}
                  disabled={step === 'tier' && hasMultipleTiers && !selectedTier}
                  className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
