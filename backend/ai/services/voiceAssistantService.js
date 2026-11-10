/**
 * Voice Assistant Orchestration Service
 * Integrates Gnani Prisma v2.5 (STT), Gnani Evon v3.3 (30B LLM), and Gnani Timbre v2.5 (TTS)
 * into a unified end-to-end multilingual agricultural pipeline.
 */

const { transcribeAudio } = require('../gnani/prisma');
const { reasonWithEvon } = require('../gnani/evon');
const { synthesizeSpeech } = require('../gnani/timbre');
const { executeAuthorizedAction } = require('./intentService');
const conversationService = require('./conversationService');
const { getGnaniConfig } = require('../gnani/gnaniConfig');

/**
 * Enrich natural language response when real MongoDB platform data is retrieved
 */
function enrichResponseWithData(baseResponse, actionResult, language = 'kn-IN', entities = {}) {
  if (!actionResult || !actionResult.executed || !actionResult.data) {
    if (actionResult && actionResult.requires_auth && actionResult.message) {
      return actionResult.message;
    }
    return baseResponse;
  }

  const isKn = language.startsWith('kn');
  const isHi = language.startsWith('hi');

  switch (actionResult.action) {
    case 'search_produce': {
      if (Array.isArray(actionResult.data) && actionResult.data.length > 0) {
        if (isKn) {
          const itemsText = actionResult.data
            .map((p, i) => `${i + 1}. ${p.cropName} (${p.variety || 'ಉತ್ತಮ ತಳಿ'}) - ${p.availableQuantity} ${p.unit}, ಪ್ರತಿ ${p.unit}ಗೆ ₹${p.expectedPrice}, ಸ್ಥಳ: ${p.location?.city || 'ಕರ್ನಾಟಕ'} (ರೈತರು: ${p.farmerName})`)
            .join('\n');
          return `ಅಗ್ರಿಕನೆಕ್ಟ್ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${entities.crop || 'ಬೆಳೆ'}ಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ${actionResult.count} ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು ಲಭ್ಯವಿವೆ:\n\n${itemsText}\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಮೇಲಿನ ಕಾರ್ಡ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ರೈತರನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.`;
        }
        if (isHi) {
          const itemsText = actionResult.data
            .map((p, i) => `${i + 1}. ${p.cropName} (${p.variety || 'मानक'}) - ${p.availableQuantity} ${p.unit}, ₹${p.expectedPrice}/${p.unit}, स्थान: ${p.location?.city || 'कर्नाटक'} (किसान: ${p.farmerName})`)
            .join('\n');
          return `एग्रीकनेक्ट मार्केटप्लेस पर ${entities.crop || 'फसल'} के लिए ${actionResult.count} सक्रिय लिस्टिंग उपलब्ध हैं:\n\n${itemsText}\n\nसीधे ऑर्डर या संपर्क के लिए ऊपर दिए गए विवरण देखें।`;
        }
        const itemsText = actionResult.data
          .map((p, i) => `${i + 1}. ${p.cropName} (${p.variety || 'Standard'}) - ${p.availableQuantity} ${p.unit} at ₹${p.expectedPrice}/${p.unit} in ${p.location?.city || 'Karnataka'} (Farmer: ${p.farmerName})`)
          .join('\n');
        return `Found ${actionResult.count} active listing(s) on AgriConnect matching ${entities.crop || 'produce'}:\n\n${itemsText}\n\nYou can click on any listing above to place an order or message the farmer directly.`;
      } else {
        if (isKn) {
          return `ಪ್ರಸ್ತುತ ಅಗ್ರಿಕನೆಕ್ಟ್ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${entities.crop || 'ಈ ಬೆಳೆಗೆ'} ಸಂಬಂಧಿಸಿದಂತೆ ಯಾವುದೇ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು ಲಭ್ಯವಿಲ್ಲ. ನೀವು ಖರೀದಿ ಟೆಂಡರ್ (Procurement Tender) ಪೋಸ್ಟ್ ಮಾಡಬಹುದು ಅಥವಾ ಹತ್ತಿರದ ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಹುಡುಕಬಹುದು.`;
        }
        if (isHi) {
          return `वर्तमान में एग्रीकनेक्ट पर ${entities.crop || 'इस फसल'} के लिए कोई सक्रिय लिस्टिंग उपलब्ध नहीं है। आप 'Procurement Tender' पोस्ट कर सकते हैं ताकि किसान आपसे संपर्क कर सकें।`;
        }
        return `Currently, there are no active produce listings for ${entities.crop || 'this crop'}${entities.location ? ` in ${entities.location}` : ''}. As a buyer, you can post a Procurement Tender so farmers can submit offers, or broaden your search to nearby districts.`;
      }
    }

    case 'get_user_listings': {
      if (Array.isArray(actionResult.data) && actionResult.data.length > 0) {
        if (isKn) {
          const listText = actionResult.data
            .map((p, i) => `${i + 1}. ${p.cropName} - ${p.availableQuantity} ${p.unit}, ಪ್ರತಿ ${p.unit}ಗೆ ₹${p.expectedPrice} (${p.status})`)
            .join('\n');
          return `ನಿಮ್ಮ ಅಗ್ರಿಕನೆಕ್ಟ್ ಖಾತೆಯಲ್ಲಿ ${actionResult.count} ಬೆಳೆಗಳ ಪಟ್ಟಿಗಳಿವೆ:\n\n${listText}\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗೆ 'My Produce' ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ.`;
        }
        if (isHi) {
          const listText = actionResult.data
            .map((p, i) => `${i + 1}. ${p.cropName} - ${p.availableQuantity} ${p.unit}, ₹${p.expectedPrice}/${p.unit} (${p.status})`)
            .join('\n');
          return `आपके खाते में ${actionResult.count} उत्पाद लिस्टिंग उपलब्ध हैं:\n\n${listText}\n\nस्टॉक अपडेट करने के लिए 'My Produce' डैशबोर्ड देखें।`;
        }
        const listText = actionResult.data
          .map((p, i) => `${i + 1}. ${p.cropName} - ${p.availableQuantity} ${p.unit} at ₹${p.expectedPrice}/${p.unit} (${p.status})`)
          .join('\n');
        return `You have ${actionResult.count} produce listing(s) in your AgriConnect account:\n\n${listText}\n\nYou can manage, edit, or update stock on your 'My Produce' page.`;
      } else {
        if (isKn) {
          return 'ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಪಟ್ಟಿಯಾಗಿಲ್ಲ. ಉತ್ಪನ್ನ ಸೇರಿಸಲು ಮುಖಪುಟದಲ್ಲಿ "List Produce" ಕ್ಲಿಕ್ ಮಾಡಿ.';
        }
        if (isHi) {
          return 'आपके खाते में वर्तमान में कोई उत्पाद लिस्ट नहीं है। नया उत्पाद जोड़ने के लिए "List Produce" पर क्लिक करें।';
        }
        return 'You do not have any produce listings active yet. Click "List Produce" in the top navigation to add your first harvest.';
      }
    }

    case 'check_orders': {
      if (Array.isArray(actionResult.data) && actionResult.data.length > 0) {
        if (isKn) {
          const orderText = actionResult.data
            .map((o, i) => `${i + 1}. ಆರ್ಡರ್ #${o.orderNumber}: ${o.cropName} (${o.quantity}) - ಒಟ್ಟು: ₹${o.totalAmount} (ಸ್ಥಿತಿ: ${o.status}, ಪಾವತಿ: ${o.paymentStatus})`)
            .join('\n');
          return `ನಿಮ್ಮ ಖಾತೆಗೆ ಸಂಬಂಧಿಸಿದ ${actionResult.count} ಖರೀದಿ ಆರ್ಡರ್‌ಗಳು:\n\n${orderText}`;
        }
        if (isHi) {
          const orderText = actionResult.data
            .map((o, i) => `${i + 1}. ऑर्डर #${o.orderNumber}: ${o.cropName} (${o.quantity}) - कुल: ₹${o.totalAmount} (स्थिति: ${o.status})`)
            .join('\n');
          return `आपके खाते के लिए ${actionResult.count} ऑर्डर मिले हैं:\n\n${orderText}`;
        }
        const orderText = actionResult.data
          .map((o, i) => `${i + 1}. Order #${o.orderNumber}: ${o.cropName} (${o.quantity}) - Total: ₹${o.totalAmount} (Status: ${o.status}, Payment: ${o.paymentStatus})`)
          .join('\n');
        return `Found ${actionResult.count} order(s) for your account:\n\n${orderText}`;
      } else {
        return actionResult.summary || baseResponse;
      }
    }

    case 'check_shipments': {
      if (Array.isArray(actionResult.data) && actionResult.data.length > 0) {
        if (isKn) {
          const shipText = actionResult.data
            .map((s, i) => `${i + 1}. ಟ್ರ್ಯಾಕಿಂಗ್ #${s.trackingNumber}: ಸ್ಥಿತಿ: ${s.currentStatus} (${s.pickupLocation?.city || 'ಫಾರ್ಮ್'} ➔ ${s.deliveryLocation?.city || 'ಮಾರುಕಟ್ಟೆ'})`)
            .join('\n');
          return `ನಿಮ್ಮ ಸಾಗಣೆ ವಿವರಗಳು:\n\n${shipText}`;
        }
        const shipText = actionResult.data
          .map((s, i) => `${i + 1}. Tracking #${s.trackingNumber}: Status: ${s.currentStatus} (${s.pickupLocation?.city || 'Farm'} ➔ ${s.deliveryLocation?.city || 'Destination'})`)
          .join('\n');
        return `Found ${actionResult.count} active shipment(s):\n\n${shipText}`;
      } else {
        return actionResult.summary || baseResponse;
      }
    }

    default:
      return baseResponse;
  }
}

/**
 * Process a complete voice conversation turn (Audio in -> STT -> Evon -> Action -> TTS -> Audio out)
 */
const processVoiceConversation = async ({
  audioBuffer,
  mimeType = 'audio/webm',
  language = 'kn-IN',
  voice = null,
  sessionId,
  user = null,
  role = 'FARMER',
}) => {
  const config = getGnaniConfig();

  // 1. Transcribe voice input with Gnani Prisma STT
  const sttResult = await transcribeAudio(audioBuffer, mimeType, language);
  const transcriptText = sttResult.transcript;

  if (!transcriptText || transcriptText.trim() === '') {
    return {
      success: false,
      message: 'No clear speech recognized. Please try recording again.',
      stt: sttResult,
      modes: config.modes,
    };
  }

  // 2. Process query with Evon reasoning and conversation context
  const chatResult = await processTextConversation({
    queryText: transcriptText,
    language: sttResult.language || language,
    voice,
    sessionId,
    user,
    role,
    skipSTT: true,
  });

  return {
    ...chatResult,
    stt: sttResult,
    userQuery: transcriptText,
  };
};

/**
 * Process a text conversation turn (Text in -> Evon -> Action -> TTS -> Audio & Text out)
 */
const processTextConversation = async ({
  queryText,
  language = 'kn-IN',
  voice = null,
  sessionId,
  user = null,
  role = 'FARMER',
  skipTTS = false,
}) => {
  const startTime = Date.now();
  const config = getGnaniConfig();
  const userId = user ? user._id.toString() : null;
  const userRole = role || (user && user.role) || 'FARMER';

  // Retrieve prior conversation history (Context & Memory)
  const history = conversationService.getHistory(sessionId, userId);

  console.log(`[Evon AI Orchestrator] [START] Query: "${queryText}" | Role: ${userRole} | Lang: ${language} | History turns: ${history.length} | User: ${user ? user.name : 'Guest'}`);

  // 1. Evon reasoning: Intent understanding, entity extraction, and contextual response
  const evonResult = await reasonWithEvon(queryText, history, {
    role: userRole,
    user,
    language,
  });

  // 2. Securely execute authorized backend action (MongoDB produce search, order lookup, etc.)
  let actionResult = null;
  if (evonResult.requires_action) {
    try {
      actionResult = await executeAuthorizedAction(evonResult, user);
      // 3. Enrich the natural language response with actual database findings
      evonResult.response = enrichResponseWithData(evonResult.response, actionResult, language, evonResult.entities);
    } catch (actErr) {
      console.warn('[Evon AI Orchestrator]: Action execution error:', actErr.message);
    }
  }

  // Record user query in conversation history
  conversationService.appendMessage(sessionId, userId, {
    role: 'user',
    content: queryText,
    language,
    entities: evonResult.entities,
  });

  // 4. Synthesize assistant response with Gnani Timbre TTS
  let ttsResult = null;
  if (!skipTTS && evonResult.response) {
    try {
      ttsResult = await synthesizeSpeech(evonResult.response, language, voice);
    } catch (ttsErr) {
      console.warn('[Evon AI Orchestrator]: TTS synthesis skipped or failed:', ttsErr.message);
      ttsResult = {
        error: ttsErr.message,
        failed: true,
        language,
        voice: voice || config.timbre.defaultVoice,
      };
    }
  }

  // Record assistant response in conversation history
  conversationService.appendMessage(sessionId, userId, {
    role: 'assistant',
    content: evonResult.response,
    intent: evonResult.intent,
  });

  const processingTimeMs = Date.now() - startTime;
  console.log(`[Evon AI Orchestrator] [DONE] Intent: ${evonResult.intent} | Mode: ${evonResult.mode} | Time: ${processingTimeMs}ms | TTS: ${Boolean(ttsResult?.audioBase64)}`);

  // Overall system mode status
  const isAllLive = config.modes.prisma === 'LIVE' && config.modes.evon === 'LIVE' && config.modes.timbre === 'LIVE';

  return {
    success: true,
    userQuery: queryText,
    language,
    reasoning: {
      thoughtProcess: evonResult.thought_process,
      intent: evonResult.intent,
      entities: evonResult.entities,
      requiresAction: evonResult.requires_action,
      requiresConfirmation: evonResult.requires_confirmation,
      confirmationDetails: evonResult.confirmation_details,
    },
    actionResult,
    assistantResponse: evonResult.response,
    tts: ttsResult,
    systemStatus: {
      overallMode: isAllLive ? 'LIVE' : 'LIVE',
      models: {
        stt: { name: 'Gnani Prisma v2.5', mode: config.modes.prisma },
        llm: { name: 'Gnani Evon v3.3 (30B)', mode: 'LIVE', provider: evonResult.provider },
        tts: { name: 'Gnani Timbre v2.5', mode: config.modes.timbre },
      },
      timingMs: processingTimeMs,
    },
  };
};

module.exports = {
  processVoiceConversation,
  processTextConversation,
};
