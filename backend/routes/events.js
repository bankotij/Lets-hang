import express from 'express';
import { Event } from '../models/Event.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { schedulePayout, PLATFORM_FEE_PERCENT, CANCELLATION_FEE_PERCENT } from '../services/payoutService.js';
import { sendTemplateEmail } from '../services/emailService.js';
import { formatEventDate } from '../services/ticketService.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, category, status, hostId } = req.query;
    
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (hostId) {
      query.hostId = hostId;
    }
    
    const events = await Event.find(query)
      .sort({ date: 1 })
      .lean();
    
    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
});

// @route   GET /api/events/user/hosted
// @desc    Get events hosted by current user
// @access  Private
router.get('/user/hosted', authenticate, async (req, res) => {
  try {
    const events = await Event.find({ hostId: req.user._id.toString() })
      .sort({ date: -1 })
      .lean();
    
    res.json({
      success: true,
      events: events.map(e => ({ ...e, id: e._id.toString() })),
    });
  } catch (error) {
    console.error('Get hosted events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hosted events',
    });
  }
});

// @route   GET /api/events/user/attending
// @desc    Get events user is attending
// @access  Private
router.get('/user/attending', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    const events = await Event.find({
      $or: [
        { 'attendees.id': userId },
        { 'joinRequests.id': userId },
      ],
    })
      .sort({ date: 1 })
      .lean();
    
    res.json({
      success: true,
      events: events.map(e => ({ ...e, id: e._id.toString() })),
    });
  } catch (error) {
    console.error('Get attending events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attending events',
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    res.json({
      success: true,
      event: {
        ...event,
        id: event._id.toString(),
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
});

// @route   POST /api/events
// @desc    Create/publish a new event
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      // Basic info
      name,
      description,
      date,
      endDate,
      location,
      venueDetails,
      
      // Media
      flyerUrl,
      backgroundUrl,
      gallery,
      links,
      quickLinks,
      
      // Ticket Tiers
      ticketTiers,
      hasMultipleTiers,
      
      // Legacy pricing
      capacity,
      costPerPerson,
      
      // Add-ons
      addOns,
      
      // Custom Questions
      customQuestions,
      
      // Categorization
      category,
      tags,
      
      // Privacy
      privacyType,
      isPrivate,
      eventPassword,
      
      // Plus-ones
      allowPlusOnes,
      maxPlusOnes,
      plusOneCost,
      
      // Group registration
      allowGroupRegistration,
      minGroupSize,
      maxGroupSize,
      groupDiscount,
    } = req.body;
    
    if (!name || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name, date, and location are required',
      });
    }
    
    // Generate invite code for invite-only events
    let inviteCode;
    if (privacyType === 'invite-only') {
      inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    }
    
    const event = new Event({
      // Basic info
      name,
      description,
      date,
      endDate,
      location,
      venueDetails,
      
      // Media
      flyerUrl,
      backgroundUrl,
      gallery: gallery || [],
      links: links || [],
      quickLinks: quickLinks || [],
      
      // Ticket Tiers
      ticketTiers: ticketTiers || [],
      hasMultipleTiers: hasMultipleTiers || false,
      
      // Legacy pricing
      capacity: capacity || 50,
      costPerPerson: costPerPerson || 0,
      
      // Add-ons
      addOns: addOns || [],
      
      // Custom Questions
      customQuestions: customQuestions || [],
      
      // Categorization
      category: category || 'other',
      tags: tags || [],
      
      // Privacy
      privacyType: privacyType || 'public',
      isPrivate: isPrivate || privacyType !== 'public',
      inviteCode,
      eventPassword,
      
      // Plus-ones
      allowPlusOnes: allowPlusOnes || false,
      maxPlusOnes: maxPlusOnes || 1,
      plusOneCost: plusOneCost || 0,
      
      // Group registration
      allowGroupRegistration: allowGroupRegistration || false,
      minGroupSize: minGroupSize || 2,
      maxGroupSize: maxGroupSize || 10,
      groupDiscount: groupDiscount || 0,
      
      // Host info
      hostId: req.user._id.toString(),
      hostName: req.user.name,
      hostAvatar: req.user.avatar,
      hostEmail: req.user.email,
      
      // Initial state
      attendees: [],
      joinRequests: [],
      waitlist: [],
      guestList: [],
      status: 'upcoming',
    });
    
    await event.save();
    
    // Update user's hosted events count
    req.user.eventsHosted = (req.user.eventsHosted || 0) + 1;
    await req.user.save();
    
    console.log(`Event created: ${event.name} by ${req.user.name}`);
    
    res.status(201).json({
      success: true,
      event: {
        ...event.toObject(),
        id: event._id.toString(),
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (host only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.hostId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can update this event',
      });
    }
    
    const allowedUpdates = [
      'name', 'description', 'date', 'endDate', 'location', 'venueDetails',
      'flyerUrl', 'backgroundUrl', 'gallery', 'links', 'quickLinks',
      'ticketTiers', 'hasMultipleTiers', 'capacity', 'costPerPerson',
      'addOns', 'customQuestions', 'category', 'tags',
      'privacyType', 'isPrivate', 'eventPassword',
      'allowPlusOnes', 'maxPlusOnes', 'plusOneCost',
      'allowGroupRegistration', 'minGroupSize', 'maxGroupSize', 'groupDiscount'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });
    
    await event.save();
    
    res.json({
      success: true,
      event: {
        ...event.toObject(),
        id: event._id.toString(),
      },
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
});

// @route   POST /api/events/:id/join
// @desc    Join a public event (supports multiple tickets)
// @access  Private
router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const { paymentId, amountPaid, ticketCount = 1 } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.isPrivate) {
      return res.status(400).json({
        success: false,
        message: 'This is a private event. Please request to join.',
      });
    }
    
    // Check capacity for multiple tickets
    const currentAttendeeCount = event.attendees.reduce((sum, a) => sum + (a.ticketCount || 1), 0);
    if (currentAttendeeCount + ticketCount > event.capacity) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.capacity - currentAttendeeCount} spots remaining`,
      });
    }
    
    // Check if already joined - if so, add to their ticket count
    const existingAttendee = event.attendees.find(a => a.id === req.user._id.toString());
    if (existingAttendee) {
      existingAttendee.ticketCount = (existingAttendee.ticketCount || 1) + ticketCount;
      existingAttendee.amountPaid = (existingAttendee.amountPaid || 0) + (amountPaid || 0);
      if (paymentId) {
        existingAttendee.paymentIds = existingAttendee.paymentIds || [];
        existingAttendee.paymentIds.push(paymentId);
      }
    } else {
      event.attendees.push({
        id: req.user._id.toString(),
        name: req.user.name,
        avatar: req.user.avatar,
        paymentId,
        paymentIds: paymentId ? [paymentId] : [],
        amountPaid: amountPaid || 0,
        ticketCount,
      });
    }
    
    // Update financials
    if (amountPaid > 0) {
      event.totalCollected += amountPaid;
      event.platformFee = Math.round(event.totalCollected * (PLATFORM_FEE_PERCENT / 100));
      event.hostEarnings = event.totalCollected - event.platformFee;
    }
    
    await event.save();
    
    // Update user's attended events count
    if (!existingAttendee) {
      req.user.eventsAttended = (req.user.eventsAttended || 0) + 1;
      await req.user.save();
    }
    
    res.json({
      success: true,
      message: ticketCount > 1 
        ? `Successfully purchased ${ticketCount} tickets`
        : 'Successfully joined the event',
      ticketCount,
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join event',
    });
  }
});

// @route   POST /api/events/:id/request
// @desc    Request to join a private event
// @access  Private
router.post('/:id/request', authenticate, async (req, res) => {
  try {
    const { paymentId, amountPaid } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    const alreadyRequested = event.joinRequests.some(r => r.id === req.user._id.toString());
    if (alreadyRequested) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to join',
      });
    }
    
    const alreadyJoined = event.attendees.some(a => a.id === req.user._id.toString());
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this event',
      });
    }
    
    event.joinRequests.push({
      id: req.user._id.toString(),
      name: req.user.name,
      avatar: req.user.avatar,
      paymentId,
      amountPaid: amountPaid || 0,
    });
    
    await event.save();
    
    res.json({
      success: true,
      message: 'Join request sent',
    });
  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send join request',
    });
  }
});

// @route   POST /api/events/:id/cancel
// @desc    Cancel attendance
// @access  Private
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    const attendeeIndex = event.attendees.findIndex(a => a.id === req.user._id.toString());
    
    if (attendeeIndex === -1) {
      // Check join requests
      const requestIndex = event.joinRequests.findIndex(r => r.id === req.user._id.toString());
      
      if (requestIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'You are not part of this event',
        });
      }
      
      // Remove from join requests (full refund for pending requests)
      const request = event.joinRequests[requestIndex];
      event.joinRequests.splice(requestIndex, 1);
      await event.save();
      
      // Send cancellation email for pending request (full refund)
      try {
        await sendTemplateEmail(req.user.email, 'cancellation', {
          eventName: event.name,
          eventDate: formatEventDate(event.date),
          eventLocation: event.location,
          ticketCount: request.ticketCount || 1,
          originalAmount: request.amountPaid || 0,
          cancellationFee: 0,
          refundAmount: request.amountPaid || 0,
          cancellationFeePercent: 0,
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr);
      }
      
      return res.json({
        success: true,
        message: 'Join request cancelled',
        refundAmount: request.amountPaid,
        paymentId: request.paymentId,
      });
    }
    
    // Remove from attendees
    const attendee = event.attendees[attendeeIndex];
    const originalAmount = attendee.amountPaid || 0;
    const ticketCount = attendee.ticketCount || 1;
    
    // Calculate cancellation fee and refund
    const cancellationFee = originalAmount > 0 ? Math.round(originalAmount * (CANCELLATION_FEE_PERCENT / 100)) : 0;
    const refundAmount = originalAmount - cancellationFee;
    
    event.attendees.splice(attendeeIndex, 1);
    
    // Update financials - only subtract the refund amount (keep cancellation fee in pool)
    if (refundAmount > 0) {
      event.totalCollected -= refundAmount;
      event.platformFee = Math.round(event.totalCollected * (PLATFORM_FEE_PERCENT / 100));
      event.hostEarnings = event.totalCollected - event.platformFee;
    }
    
    await event.save();
    
    // Update user's attended events count
    req.user.eventsAttended = Math.max(0, (req.user.eventsAttended || 0) - 1);
    await req.user.save();
    
    // Send cancellation email
    try {
      await sendTemplateEmail(req.user.email, 'cancellation', {
        eventName: event.name,
        eventDate: formatEventDate(event.date),
        eventLocation: event.location,
        ticketCount,
        originalAmount,
        cancellationFee,
        refundAmount,
        cancellationFeePercent: CANCELLATION_FEE_PERCENT,
      });
    } catch (emailErr) {
      console.error('Failed to send cancellation email:', emailErr);
    }
    
    res.json({
      success: true,
      message: `Attendance cancelled. ${refundAmount > 0 ? `₹${(refundAmount / 100).toFixed(2)} will be refunded.` : ''}`,
      originalAmount,
      cancellationFee,
      refundAmount,
      paymentId: attendee.paymentId,
    });
  } catch (error) {
    console.error('Cancel attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel attendance',
    });
  }
});

// @route   POST /api/events/:id/complete
// @desc    Mark event as completed
// @access  Private (host only)
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.hostId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can complete this event',
      });
    }
    
    event.status = 'completed';
    await event.save();
    
    // Schedule payout if there are earnings
    if (event.hostEarnings > 0) {
      schedulePayout({
        eventId: event._id.toString(),
        eventName: event.name,
        eventEndDate: new Date().toISOString(),
        hostId: event.hostId,
        hostName: event.hostName,
        hostEmail: req.user.email,
        hostUpiId: req.user.upiId,
        hostBankDetails: req.user.bankDetails,
        totalAmount: event.totalCollected,
      });
    }
    
    res.json({
      success: true,
      message: 'Event marked as completed',
    });
  } catch (error) {
    console.error('Complete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete event',
    });
  }
});

// @route   POST /api/events/:id/payout
// @desc    Request payout for event
// @access  Private (host only)
router.post('/:id/payout', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    if (event.hostId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can request payout',
      });
    }
    
    if (event.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Event must be completed before requesting payout',
      });
    }
    
    if (event.payoutStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payout has already been processed',
      });
    }
    
    event.payoutStatus = 'processing';
    await event.save();
    
    // In production, this would trigger actual payout
    // For now, simulate payout completion
    setTimeout(async () => {
      event.payoutStatus = 'paid';
      event.payoutCompletedAt = new Date();
      await event.save();
    }, 2000);
    
    res.json({
      success: true,
      message: 'Payout requested. You will receive the funds shortly.',
      amount: event.hostEarnings,
    });
  } catch (error) {
    console.error('Payout request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request payout',
    });
  }
});

// @route   GET /api/events/:id/status
// @desc    Get user's status for an event
// @access  Private
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }
    
    const userId = req.user._id.toString();
    
    if (event.hostId === userId) {
      return res.json({ success: true, status: 'host' });
    }
    
    const attendee = event.attendees.find(a => a.id === userId);
    if (attendee) {
      return res.json({ success: true, status: 'joined', attendee });
    }
    
    const request = event.joinRequests.find(r => r.id === userId);
    if (request) {
      return res.json({ success: true, status: 'pending', request });
    }
    
    res.json({ success: true, status: 'none' });
  } catch (error) {
    console.error('Get event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event status',
    });
  }
});

export default router;

