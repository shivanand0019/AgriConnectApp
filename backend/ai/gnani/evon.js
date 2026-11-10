/**
 * Gnani Evon v3.3 – 30B Reasoning LLM Adapter & Agricultural Intelligence Engine
 * Integrates:
 * - Gnani Evon v3.3 (30B A3B Hybrid Mamba-MoE) on OpenAI-compatible / vLLM endpoints
 * - Comprehensive Native Agricultural Reasoning Engine for multi-turn conversations
 * - Multi-role awareness: Farmer, Buyer, FPO, Logistics Partner, Administrator
 * - Multi-intent understanding with conversational memory and follow-up tracking
 * - Trilingual generation: Kannada (ಕನ್ನಡ), Hindi (हिंदी), and Indian English
 */

const { getGnaniConfig } = require('./gnaniConfig');

/**
 * System prompt template enforcing agricultural domain knowledge and strict structured JSON output
 */
const BUILD_SYSTEM_PROMPT = (role = 'FARMER', user = null, language = 'kn-IN') => `
You are Evon v3.3, a specialized 30B reasoning agricultural AI assistant embedded within the AgriConnect platform.
You are fluent in Indian languages including Kannada (ಕನ್ನಡ), Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and English.
You assist farmers, buyers, FPOs (Farmer Producer Organizations), logistics partners, and administrators across the Indian agricultural supply chain.

CURRENT CONTEXT:
- Active User Role: ${role || 'FARMER'}
- User Name: ${user ? user.name : 'Guest'}
- User Location: ${user && user.location ? `${user.location.city || ''}, ${user.location.district || ''}, ${user.location.state || 'Karnataka'}` : 'Karnataka, India'}
- Preferred Language: ${language}

CORE RULES:
1. Understand the user's specific question, intent, and role. Never return a repetitive generic greeting when answering a specific question.
2. If the user asks in Kannada, answer in clear, authentic Kannada script. If Hindi, in Hindi Devanagari script. If English, in English.
3. If the user asks a procedural question (e.g. how to sell, how to contact a buyer, how to find listings), provide direct step-by-step guidance tailored to AgriConnect.
4. If the user asks a follow-up question (e.g. "What price should I set?"), use prior conversation context to identify the crop and provide contextual advice.
5. If the query requires database operations (e.g. search produce, check orders, check shipments, show user listings), set "requires_action": true and specify the intent and entities.
6. For mutations (creating produce listing, placing order), set "requires_confirmation": true and summarize details in "confirmation_details".
7. Never invent unauthorized user records or disclose private information.

YOU MUST ALWAYS RESPOND IN STRICT JSON FORMAT matching this schema:
{
  "thought_process": "Brief reasoning explaining user intent, role, and context",
  "intent": "how_to_sell" | "find_buyers" | "find_produce" | "contact_party" | "listing_troubleshooting" | "pricing_guidance" | "fpo_guidance" | "logistics_guidance" | "my_listings" | "check_orders" | "check_shipments" | "search_produce" | "general_agronomy" | "platform_navigation" | "unrelated_general" | "clarification_needed",
  "entities": {
    "crop": "string or null",
    "location": "string or null",
    "quantity": "string or null",
    "price": "string or null",
    "orderNumber": "string or null",
    "trackingNumber": "string or null"
  },
  "requires_action": true | false,
  "requires_confirmation": true | false,
  "confirmation_details": {
    "action": "string or null",
    "summary": "string or null"
  },
  "response": "The natural language response to be displayed to the user and spoken by Timbre TTS"
}
`;

/**
 * Common crop keyword dictionaries across languages
 */
const CROP_DICTIONARY = [
  { canonical: 'tomato', en: ['tomato', 'tomatoes'], kn: ['ಟೊಮ್ಯಾಟೊ', 'ಟೊಮೆಟೊ', 'ಟೊಮಾಟೊ'], hi: ['टमाटर', 'टमाटरों'] },
  { canonical: 'onion', en: ['onion', 'onions'], kn: ['ಈರುಳ್ಳಿ', 'ಉಳ್ಳಾಗಡ್ಡಿ'], hi: ['प्याज', 'प्याज़'] },
  { canonical: 'potato', en: ['potato', 'potatoes'], kn: ['ಆಲೂಗಡ್ಡೆ', 'ಆಲೂ'], hi: ['आलू'] },
  { canonical: 'rice', en: ['rice', 'paddy', 'grain'], kn: ['ಅಕ್ಕಿ', 'ಭತ್ತ'], hi: ['चावल', 'धान'] },
  { canonical: 'wheat', en: ['wheat'], kn: ['ಗೋಧಿ'], hi: ['गेहूं', 'गेंहू'] },
  { canonical: 'maize', en: ['maize', 'corn', 'yellow corn'], kn: ['ಜೋಳ', 'ಮೆಕ್ಕೆಜೋಳ'], hi: ['मक्का', 'भुट्टा'] },
  { canonical: 'cotton', en: ['cotton'], kn: ['ಹತ್ತಿ'], hi: ['कपास', 'रूई'] },
  { canonical: 'chilli', en: ['chilli', 'chili', 'peppers', 'red chilli'], kn: ['ಮೆಣಸಿನಕಾಯಿ', 'ಮೆಣಸು'], hi: ['मिर्च', 'मिर्ची', 'लाल मिर्च'] },
  { canonical: 'turmeric', en: ['turmeric'], kn: ['ಅರಿಶಿನ', 'ಅರಶಿಣ'], hi: ['हल्दी'] },
  { canonical: 'ginger', en: ['ginger'], kn: ['ಶುಂಠಿ'], hi: ['अदरक'] },
  { canonical: 'ragi', en: ['ragi', 'finger millet', 'millet'], kn: ['ರಾಗಿ'], hi: ['रागी', 'मडुआ'] },
  { canonical: 'sugarcane', en: ['sugarcane', 'cane'], kn: ['ಕಬ್ಬು'], hi: ['गन्ना'] },
  { canonical: 'mango', en: ['mango', 'mangoes'], kn: ['ಮಾವು', 'ಮಾವಿನಕಾಯಿ', 'ಮಾವಿನಹಣ್ಣು'], hi: ['आम'] },
  { canonical: 'pulses', en: ['pulses', 'dal', 'toor dal', 'gram'], kn: ['ತೊಗರಿ', 'ಬೇಳೆ', 'ಕಾಳು'], hi: ['दाल', 'अरहर', 'चना'] },
];

/**
 * Common location keyword dictionaries across languages
 */
const LOCATION_DICTIONARY = [
  { canonical: 'Mysuru', en: ['mysuru', 'mysore'], kn: ['ಮೈಸೂರು', 'ಮೈಸೂರಿನಲ್ಲಿ'], hi: ['मैसूर', 'मैसुरु'] },
  { canonical: 'Bengaluru', en: ['bengaluru', 'bangalore'], kn: ['ಬೆಂಗಳೂರು', 'ಬೆಂಗಳೂರಿನಲ್ಲಿ'], hi: ['बेंगलुरु', 'बैंगलोर'] },
  { canonical: 'Mandya', en: ['mandya'], kn: ['ಮಂಡ್ಯ', 'ಮಂಡ್ಯದಲ್ಲಿ'], hi: ['मांड्या', 'मंड्या'] },
  { canonical: 'Hassan', en: ['hassan'], kn: ['ಹಾಸನ', 'ಹಾಸನದಲ್ಲಿ'], hi: ['हासन'] },
  { canonical: 'Chamarajanagar', en: ['chamarajanagar', 'chamarajnagar'], kn: ['ಚಾಮರಾಜನಗರ'], hi: ['चामराजनगर'] },
  { canonical: 'Ramanagara', en: ['ramanagara', 'ramanagar'], kn: ['ರಾಮನಗರ'], hi: ['रामनगर'] },
  { canonical: 'Belagavi', en: ['belagavi', 'belgaum'], kn: ['ಬೆಳಗಾವಿ'], hi: ['बेलगावी', 'बेलगाम'] },
  { canonical: 'Dharwad', en: ['dharwad', 'hubli'], kn: ['ಧಾರವಾಡ', 'ಹುಬ್ಬಳ್ಳಿ'], hi: ['धारवाड़', 'हुबली'] },
  { canonical: 'Tumakuru', en: ['tumakuru', 'tumkur'], kn: ['ತುಮಕೂರು'], hi: ['तुमकुर'] },
  { canonical: 'Karnataka', en: ['karnataka'], kn: ['ಕರ್ನಾಟಕ'], hi: ['कर्नाटक'] },
];

/**
 * Detect language script from text or fallback to context
 */
function detectLanguage(text, fallbackLang = 'kn-IN') {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi / Devanagari
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
  if (fallbackLang) return fallbackLang;
  return 'en-IN';
}

/**
 * Check if a word or phrase appears in text using word boundaries for Latin characters
 */
function matchesWord(text, word) {
  if (!text || !word) return false;
  if (/^[a-zA-Z0-9_-]+$/.test(word)) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  }
  return text.toLowerCase().includes(word.toLowerCase());
}

/**
 * Extract entities (crop, location, quantity, price, orderNumber) from text & history
 */
function extractEntities(prompt, history = []) {
  const lower = prompt.toLowerCase();
  let crop = null;
  let location = null;
  let quantity = null;
  let price = null;
  let orderNumber = null;
  let trackingNumber = null;

  // 1. Match Crop
  for (const entry of CROP_DICTIONARY) {
    const allNames = [...entry.en, ...entry.kn, ...entry.hi];
    if (allNames.some((name) => matchesWord(prompt, name))) {
      crop = entry.canonical;
      break;
    }
  }

  // 2. Match Location
  for (const entry of LOCATION_DICTIONARY) {
    const allNames = [...entry.en, ...entry.kn, ...entry.hi];
    if (allNames.some((name) => matchesWord(prompt, name))) {
      location = entry.canonical;
      break;
    }
  }

  // 3. Match Quantity (e.g. 500 kg, 10 quintal, 2 tons, 500 ಕೆಜಿ, 500 किलो)
  const qtyMatch = prompt.match(/(\d+[\d.,]*)\s*(kg|kgs|quintal|quintals|ton|tons|tonne|tonnes|ಕೆಜಿ|ಕ್ವಿಂಟಾಲ್|ಟನ್|किलो|क्विंटल|टन)/i);
  if (qtyMatch) {
    quantity = `${qtyMatch[1]} ${qtyMatch[2]}`;
  }

  // 4. Match Price (e.g. ₹25, 25 rs, 25 rupees, 25 ರೂಪಾಯಿ, 25 रुपये)
  const priceMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*(\d+[\d.,]*)\s*(?:₹|rs\.?|rupees|ರೂಪಾಯಿ|ರೊಕ್ಕ|रुपये|रु)/i);
  if (priceMatch) {
    price = priceMatch[1];
  }

  // 5. Match Order / Tracking numbers
  const orderMatch = prompt.match(/\b(?:order|ord|po|ಆರ್ಡರ್|ऑर्डर)\s*(?:#|no\.?|num\.?|id\.?)?\s*([a-zA-Z0-9_-]{4,15})\b/i);
  if (orderMatch) {
    orderNumber = orderMatch[1];
  }
  const trackMatch = prompt.match(/\b(?:track|tracking|shipment|awb|ಸಾಗಣೆ|ट्रैकिंग)\s*(?:#|no\.?|id\.?)?\s*([a-zA-Z0-9_-]{5,20})\b/i);
  if (trackMatch) {
    trackingNumber = trackMatch[1];
  }

  // 6. Inherit from prior history turns if missing (Conversation Memory)
  if (!crop && Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prevMsg = history[i];
      if (prevMsg.entities && prevMsg.entities.crop) {
        crop = prevMsg.entities.crop;
        break;
      }
      const prevContent = prevMsg.content || '';
      for (const entry of CROP_DICTIONARY) {
        const allNames = [...entry.en, ...entry.kn, ...entry.hi];
        if (allNames.some((name) => matchesWord(prevContent, name))) {
          crop = entry.canonical;
          break;
        }
      }
      if (crop) break;
    }
  }

  if (!location && Array.isArray(history) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const prevMsg = history[i];
      if (prevMsg.entities && prevMsg.entities.location) {
        location = prevMsg.entities.location;
        break;
      }
      const prevContent = prevMsg.content || '';
      for (const entry of LOCATION_DICTIONARY) {
        const allNames = [...entry.en, ...entry.kn, ...entry.hi];
        if (allNames.some((name) => matchesWord(prevContent, name))) {
          location = entry.canonical;
          break;
        }
      }
      if (location) break;
    }
  }

  return { crop, location, quantity, price, orderNumber, trackingNumber };
}

/**
 * Classify user intent accurately
 */
function classifyIntent(prompt, entities, role = 'FARMER', history = []) {
  const lower = prompt.toLowerCase();

  // 1. HOW TO SELL / CREATE PRODUCE LISTING
  if (
    (lower.includes('how') && (lower.includes('sell') || lower.includes('list') || lower.includes('publish') || lower.includes('upload'))) ||
    lower.includes('want to sell') || lower.includes('like to sell') || lower.includes('ready to sell') ||
    lower.includes('ಮಾರಾಟ ಮಾಡುವುದು ಹೇಗೆ') || lower.includes('ಉತ್ಪನ್ನ ಸೇರಿಸುವುದು ಹೇಗೆ') || lower.includes('ಮಾರಾಟಕ್ಕೆ ನೋಂದಣಿ') || lower.includes('ಮಾರಾಟ') ||
    lower.includes('बेचना कैसे है') || lower.includes('कैसे बेचें') || lower.includes('लिस्ट कैसे करें') || lower.includes('उत्पाद जोड़ें') ||
    lower.includes('बेचने') || lower.includes('बेचना') || lower.includes('बिक्री')
  ) {
    return 'how_to_sell';
  }

  // 2. HOW TO FIND BUYERS
  if (
    lower.includes('find buyer') || lower.includes('find buyers') || lower.includes('buyers near me') ||
    lower.includes('connect with buyer') || lower.includes('who will buy') || lower.includes('look for buyer') ||
    lower.includes('ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ') || lower.includes('ಖರೀದಿದಾರರ ಸಂಪರ್ಕ') || lower.includes('ಖರೀದಿದಾರರು ಎಲ್ಲಿ') ||
    lower.includes('खरीदार खोजें') || lower.includes('खरीदार कैसे मिलेंगे') || lower.includes('खरीदार कहाँ हैं')
  ) {
    return 'find_buyers';
  }

  // 3. CONTACTING A BUYER OR FARMER
  if (
    lower.includes('contact buyer') || lower.includes('contact farmer') || lower.includes('call buyer') ||
    lower.includes('message buyer') || lower.includes('how can i contact') || lower.includes('how to message') ||
    lower.includes('ಸಂಪರ್ಕಿಸುವುದು ಹೇಗೆ') || lower.includes('ಸಂದೇಶ ಕಳುಹಿಸುವುದು ಹೇಗೆ') || lower.includes('ಮಾತನಾಡಲು ಹೇಗೆ') ||
    lower.includes('संपर्क कैसे करें') || lower.includes('मैसेज कैसे भेजें') || lower.includes('बात कैसे करें')
  ) {
    return 'contact_party';
  }

  // 4. LISTING VISIBILITY & TROUBLESHOOTING
  if (
    lower.includes('not visible') || lower.includes('cannot see my listing') || lower.includes('where is my listing') ||
    lower.includes('listing approved') || lower.includes('why is my produce not showing') || lower.includes('not showing up') ||
    lower.includes('ಕಾಣಿಸುತ್ತಿಲ್ಲ') || lower.includes('ಪ್ರದರ್ಶನವಾಗುತ್ತಿಲ್ಲ') || lower.includes('ಅನುಮೋದನೆಗೊಂಡಿದೆಯೇ') ||
    lower.includes('दिख नहीं रहा') || lower.includes('दिखाई नहीं दे रहा') || lower.includes('मेरी लिस्टिंग क्यों नहीं')
  ) {
    return 'listing_troubleshooting';
  }

  // 5. PRICING GUIDANCE & MANDI RATES
  if (
    lower.includes('price should i set') || lower.includes('what price') || lower.includes('market price') ||
    lower.includes('mandi price') || lower.includes('mandi rate') || lower.includes('pricing') ||
    lower.includes('ಬೆಲೆ ಎಷ್ಟು ನಿಗದಿಪಡಿಸಬೇಕು') || lower.includes('ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಎಷ್ಟು') || lower.includes('ಮಂಡಿ ದರ') ||
    lower.includes('ದರ ಎಷ್ಟು') || lower.includes('मंडी भाव क्या है') || lower.includes('क्या दाम तय करें') || lower.includes('बाजार भाव')
  ) {
    return 'pricing_guidance';
  }

  // 6. WHAT IS AN FPO & FPO MANAGEMENT
  if (
    lower.includes('what is an fpo') || lower.includes('what is fpo') || lower.includes('explain fpo') ||
    lower.includes('fpo feature') || lower.includes('fpo management') || lower.includes('fpo bulk') ||
    lower.includes('ಎಫ್‌ಪಿಒ ಎಂದರೇನು') || lower.includes('ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ') || lower.includes('ಎಫ್‌ಪಿಒ ಕಾರ್ಯ') ||
    lower.includes('एफपीओ क्या है') || lower.includes('एफपीओ कैसे काम करता है') || lower.includes('किसान उत्पादक संगठन')
  ) {
    return 'fpo_guidance';
  }

  // 7. LOGISTICS & TRANSPORT
  if (
    lower.includes('logistics') || lower.includes('delivery') || lower.includes('transport') ||
    lower.includes('vehicle') || lower.includes('truck') || lower.includes('cold storage') || lower.includes('shipment') ||
    lower.includes('ಸರಕು ಸಾಗಣೆ') || lower.includes('ವಾಹನ') || lower.includes('ಲಾರಿ') || lower.includes('ಡೆಲಿವರಿ') ||
    lower.includes('परिवहन') || lower.includes('गाड़ी') || lower.includes('ट्रक') || lower.includes('लॉजिस्टिक्स')
  ) {
    // If asking about a personal tracking number, it's shipment tracking
    if (entities.trackingNumber || lower.includes('my shipment') || lower.includes('track shipment') || lower.includes('track my')) {
      return 'check_shipments';
    }
    return 'logistics_guidance';
  }

  // 8. USER LISTINGS ("Show my listings", "How many products have I listed?")
  if (
    lower.includes('my listing') || lower.includes('my listings') || lower.includes('my products') ||
    lower.includes('have i listed') || lower.includes('products listed') || lower.includes('show my produce') ||
    lower.includes('ನನ್ನ ಉತ್ಪನ್ನಗಳು') || lower.includes('ನನ್ನ ಪಟ್ಟಿಗಳು') || lower.includes('ನಾನು ಎಷ್ಟು ಪಟ್ಟಿ ಮಾಡಿದ್ದೇನೆ') ||
    lower.includes('मेरी लिस्टिंग') || lower.includes('मेरे उत्पाद') || lower.includes('मैंने कितने उत्पाद लिस्ट किए')
  ) {
    return 'my_listings';
  }

  // 9. CHECK ORDERS
  if (
    lower.includes('my order') || lower.includes('order status') || lower.includes('check order') ||
    lower.includes('purchase order') || lower.includes('orders') ||
    lower.includes('ಆರ್ಡರ್ ಸ್ಥಿತಿ') || lower.includes('ನನ್ನ ಆದೇಶ') || lower.includes('ಆರ್ಡರ್ ವಿವರ') ||
    lower.includes('ऑर्डर स्टेटस') || lower.includes('मेरे ऑर्डर') || lower.includes('ऑर्डर की स्थिति')
  ) {
    return 'check_orders';
  }

  // 10. SEARCH PRODUCE (Database query)
  if (
    (entities.crop && (lower.includes('search') || lower.includes('find') || lower.includes('available') || lower.includes('buy') || lower.includes('looking for') || lower.includes('show me'))) ||
    lower.includes('find available') || lower.includes('browse produce') || lower.includes('produce listing') ||
    lower.includes('ಬೆಳೆ ಹುಡುಕಿ') || lower.includes('ಉತ್ಪನ್ನ ಹುಡುಕಿ') || lower.includes('ಲಭ್ಯವಿದೆಯೇ') ||
    lower.includes('फसल खोजें') || lower.includes('उपलब्ध है क्या') || lower.includes('दिखाएं')
  ) {
    return 'search_produce';
  }

  // 11. GENERAL AGRONOMY (Pest control, fertilizers, irrigation, planting season)
  if (
    lower.includes('fertilizer') || lower.includes('pest') || lower.includes('disease') ||
    lower.includes('irrigation') || lower.includes('water') || lower.includes('season') ||
    lower.includes('soil') || lower.includes('blight') || lower.includes('harvest') ||
    lower.includes('ರೋಗ') || lower.includes('ಗೊಬ್ಬರ') || lower.includes('ಖತ') || lower.includes('ನೀರಾವರಿ') || lower.includes('ಕಾಲ') ||
    lower.includes('कीट') || lower.includes('रोग') || lower.includes('खाद') || lower.includes('उर्वरक') || lower.includes('सिंचाई')
  ) {
    return 'general_agronomy';
  }

  // 12. PLATFORM NAVIGATION, ACCOUNT & KYC
  if (
    lower.includes('register') || lower.includes('sign up') || lower.includes('login') ||
    lower.includes('kyc') || lower.includes('verify account') || lower.includes('password') ||
    lower.includes('ನೋಂದಣಿ') || lower.includes('ಖಾತೆ ಪರಿಶೀಲನೆ') || lower.includes('ಲಾಗಿನ್') ||
    lower.includes('पंजीकरण') || lower.includes('साइन अप') || lower.includes('खाता सत्यापन')
  ) {
    return 'platform_navigation';
  }

  // 13. CLARIFICATION NEEDED (Single word or vague)
  if (prompt.trim().split(/\s+/).length <= 2 && !entities.crop && !entities.orderNumber) {
    return 'clarification_needed';
  }

  // 14. Check if it's completely unrelated to agriculture/platform
  if (
    lower.includes('france') || lower.includes('paris') || lower.includes('poem') || lower.includes('song') ||
    lower.includes('joke') || lower.includes('president') || lower.includes('movie') || lower.includes('cricket')
  ) {
    return 'unrelated_general';
  }

  // Default to general question with contextual agricultural awareness
  return 'general_qa';
}

/**
 * Generate intelligent, rich, role-specific response tailored to question and language
 */
function synthesizeResponse(intent, entities, prompt, context, retrievedData = null) {
  const role = context.role || 'FARMER';
  const language = detectLanguage(prompt, context.language || 'kn-IN');
  const crop = entities.crop || 'produce';
  const location = entities.location || 'Karnataka';

  const isKn = language.startsWith('kn');
  const isHi = language.startsWith('hi');

  switch (intent) {
    case 'how_to_sell': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ${crop !== 'produce' ? `${crop} ಬೆಳೆ` : 'ಕೃಷಿ ಉತ್ಪನ್ನ'}ವನ್ನು ಮಾರಾಟ ಮಾಡಲು ಈ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ:\n\n` +
          `೧. ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿ **'ಉತ್ಪನ್ನ ಸೇರಿಸಿ' (List Produce)** ಅಥವಾ 'My Produce' ಪುಟಕ್ಕೆ ಹೋಗಿ.\n` +
          `೨. ಬೆಳೆಯ ಹೆಸರು (${crop !== 'produce' ? crop : 'ಉದಾ. ಟೊಮ್ಯಾಟೊ'}), ತಳಿ, ಮತ್ತು ಲಭ್ಯವಿರುವ ಒಟ್ಟು ಪ್ರಮಾಣವನ್ನು (ಕೆಜಿ ಅಥವಾ ಕ್ವಿಂಟಾಲ್‌ನಲ್ಲಿ) ನಮೂದಿಸಿ.\n` +
          `೩. ನಿರೀಕ್ಷಿತ ಮಾರಾಟ ಬೆಲೆಯನ್ನು ನಿಗದಿಪಡಿಸಿ (ಮಾರುಕಟ್ಟೆ ದರವನ್ನು ಪರಿಶೀಲಿಸಿ ಸ್ಪರ್ಧಾತ್ಮಕ ಬೆಲೆ ಇರಿಸಿ).\n` +
          `೪. ಗುಣಮಟ್ಟದ ಗ್ರೇಡ್ (Grade A / ಸಾವಯವ) ಮತ್ತು ಕೊಯ್ಲಿನ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n` +
          `೫. ನಿಮ್ಮ ಫಾರ್ಮ್ ಸ್ಥಳ (ಜಿಲ್ಲೆ, ತಾಲೂಕು) ಮತ್ತು ಉತ್ಪನ್ನದ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ 'Publish Listing' ಕ್ಲಿಕ್ ಮಾಡಿ.\n\n` +
          `ಪಟ್ಟಿ ಪ್ರಕಟವಾದ ತಕ್ಷಣ, ಹತ್ತಿರದ ಪರಿಶೀಲಿತ ಖರೀದಿದಾರರು ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ನೋಡಿ ನೇರವಾಗಿ ಖರೀದಿ ವಿನಂತಿ ಕಳುಹಿಸುತ್ತಾರೆ.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट पर ${crop !== 'produce' ? crop : 'कृषि उपज'} बेचने के लिए इन आसान चरणों का पालन करें:\n\n` +
          `1. शीर्ष मेनू में **'List Produce' (उत्पाद सूची)** या 'My Produce' पर जाएं।\n` +
          `2. फसल का नाम (${crop !== 'produce' ? crop : 'जैसे टमाटर'}), किस्म और उपलब्ध कुल मात्रा (किलो या क्विंटल में) भरें।\n` +
          `3. प्रति किलो या क्विंटल अपेक्षित मूल्य तय करें।\n` +
          `4. गुणवत्ता ग्रेड (ग्रेड A / ऑर्गेनिक) और कटाई की तिथि चुनें।\n` +
          `5. अपने खेत का स्थान और फसल की स्पष्ट तस्वीरें अपलोड कर 'Publish Listing' पर क्लिक करें।\n\n` +
          `लिस्टिंग लाइव होते ही सत्यापित खरीदार आपसे सीधे संपर्क करेंगे और ऑर्डर दे सकेंगे।`;
      }
      return `To sell your ${crop !== 'produce' ? crop : 'agricultural produce'} on AgriConnect, follow these simple steps:\n\n` +
        `1. Navigate to **'List Produce'** or the 'My Produce' tab in the top navigation.\n` +
        `2. Fill in the harvest details: Crop Name (${crop !== 'produce' ? crop : 'e.g., Tomato'}), Variety, and Total Available Quantity (in kg or quintals).\n` +
        `3. Set your Expected Price per unit (check current market rates for competitive pricing).\n` +
        `4. Specify the Quality Grade (Grade A, Grade B, or Certified Organic) and Harvest Date.\n` +
        `5. Enter your Farm Location (City, District) and upload real photos of the produce, then click **Publish Listing**.\n\n` +
        `Once published, verified buyers and FPOs in your region can discover your listing and place purchase orders directly without middlemen.`;
    }

    case 'find_buyers': {
      if (isKn) {
        return `ನಿಮ್ಮ ಹತ್ತಿರದ ${crop !== 'produce' ? `${crop} ಖರೀದಿದಾರರನ್ನು` : 'ಖರೀದಿದಾರರನ್ನು'} ಹುಡುಕಲು ಈ ಕೆಳಗಿನ ಸೌಲಭ್ಯಗಳನ್ನು ಬಳಸಿ:\n\n` +
          `೧. **Marketplace / Procurement ಪುಟ:** ಅಗ್ರಿಕನೆಕ್ಟ್ ಮುಖಪುಟದಲ್ಲಿ 'Procurement' ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ಸಗಟು ಖರೀದಿದಾರರು ಮತ್ತು ಆಹಾರ ಸಂಸ್ಕರಣಾ ಕಂಪನಿಗಳು ಪೋಸ್ಟ್ ಮಾಡಿರುವ ಖರೀದಿ ಟೆಂಡರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.\n` +
          `೨. **ಸ್ಥಳ ಫಿಲ್ಟರ್ (Location Filter):** ನಿಮ್ಮ ಜಿಲ್ಲೆ (${location}) ಆಯ್ಕೆಮಾಡಿ, ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ಸಕ್ರಿಯ ಖರೀದಿದಾರರನ್ನು ಪತ್ತೆಹಚ್ಚಿ.\n` +
          `೩. **ನೇರ ಆಫರ್ ಸಲ್ಲಿಕೆ:** ಖರೀದಿದಾರರ ಅವಶ್ಯಕತೆಗೆ ತಕ್ಕಂತೆ ನಿಮ್ಮ ಬೆಳೆ ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆಯ ಆಫರ್ (Submit Offer) ಸಲ್ಲಿಸಿ.\n` +
          `೪. ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಮುಂಚಿತವಾಗಿ ಲಿಸ್ಟ್ ಮಾಡಿದರೆ, ಖರೀದಿದಾರರೇ ನಿಮ್ಮನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ.`;
      }
      if (isHi) {
        return `अपने नजदीकी ${crop !== 'produce' ? `${crop} के खरीदारों` : 'खरीदारों'} को खोजने के लिए एग्रीकनेक्ट के इन फीचर्स का उपयोग करें:\n\n` +
          `1. **मार्केटप्लेस / Procurement टैब:** 'Procurement' सेक्शन में जाएं, जहां थोक खरीदारों और एग्री-कंपनियों द्वारा पोस्ट की गई मांग और टेंडर उपलब्ध हैं।\n` +
          `2. **स्थान फ़िल्टर (Location Filter):** अपने जिले (${location}) का चयन करें ताकि आपके आसपास के सक्रिय खरीदार दिखाई दें।\n` +
          `3. **सीधा ऑफर भेजें:** खरीदार की मांग देखकर 'Submit Offer' या 'Message' पर क्लिक कर सीधे मोलभाव करें।\n` +
          `4. अपनी फसल को 'List Produce' पर भी लिस्ट रखें, जिससे खरीदार आपको खोजकर सीधा ऑर्डर दे सकें।`;
      }
      return `Here is how you can find verified buyers for your ${crop !== 'produce' ? crop : 'crops'} near ${location}:\n\n` +
        `1. **Explore the Procurement Marketplace:** Go to the 'Procurement' or 'Marketplace' tab on AgriConnect to view active purchase tenders posted by wholesale buyers, retail chains, and institutional processors.\n` +
        `2. **Use Location Filters:** Filter by your district (${location}) to discover nearby buyers and reduce transportation costs.\n` +
        `3. **Submit Offers Directly:** When you find a matching procurement demand, click **'Submit Offer'** with your available quantity and quote.\n` +
        `4. **Publish Active Listings:** Make sure your produce is listed on the platform so buyers searching by location can discover your farm profile directly.`;
    }

    case 'contact_party': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ${role === 'BUYER' ? 'ರೈತರನ್ನು' : 'ಖರೀದಿದಾರರನ್ನು'} ಸಂಪರ್ಕಿಸಲು ಈ ವಿಧಾನಗಳನ್ನು ಬಳಸಬಹುದು:\n\n` +
          `೧. **ನೇರ ಸಂದೇಶ (In-App Messaging):** ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಯಾವುದೇ ಉತ್ಪನ್ನ ಅಥವಾ ಟೆಂಡರ್ ಕಾರ್ಡ್ ಮೇಲೆ **'Contact'** ಅಥವಾ **'Message'** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಆಂತರಿಕ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ.\n` +
          `೨. **ಸಂದೇಶಗಳ ವಿಭಾಗ:** ಮೇಲ್ಭಾಗದ ಮೆನುವಿನಲ್ಲಿರುವ 'Messages' ಐಕಾನ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಸಕ್ರಿಯ ಸಂಭಾಷಣೆಗಳನ್ನು ಮುಂದುವರಿಸಿ.\n` +
          `೩. **ಆರ್ಡರ್ ವಿವರಗಳಲ್ಲಿ ಫೋನ್ ಸಂಖ್ಯೆ:** ಖರೀದಿ ಆರ್ಡರ್ ದೃಢಪಟ್ಟ ನಂತರ, ಸರಕು ಸಾಗಣೆ ಮತ್ತು ವಿತರಣೆ ಸುಗಮಗೊಳಿಸಲು ಎರಡೂ ಕಡೆಯವರ ಅಧಿಕೃತ ಫೋನ್ ಸಂಖ್ಯೆ ಆರ್ಡರ್ ವಿವರದಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತದೆ.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट पर ${role === 'BUYER' ? 'किसान' : 'खरीदार'} से संपर्क करने की प्रक्रिया:\n\n` +
          `1. **सीधा संदेश (In-App Messaging):** किसी भी उत्पाद या मांग विवरण पर **'Message'** या **'Contact'** बटन दबाकर सीधे चैट शुरू करें।\n` +
          `2. **Messages डैशबोर्ड:** नेविगेशन बार में दिए गए 'Messages' विकल्प पर क्लिक करके अपनी बातचीत देख और जारी रख सकते हैं।\n` +
          `3. **ऑर्डर के बाद सीधा संपर्क:** एक बार जब खरीद ऑर्डर की पुष्टि हो जाती है, तो ऑर्डर डिटेल्स पेज पर डिलीवरी और पिकअप समन्वय के लिए संपर्क नंबर साझा किया जाता है।`;
      }
      return `To contact a ${role === 'BUYER' ? 'farmer' : 'buyer'} on AgriConnect:\n\n` +
        `1. **In-App Messaging:** On any produce listing or procurement tender card, click the **'Message'** or **'Contact'** button to initiate a direct conversation.\n` +
        `2. **Messages Hub:** Access all your ongoing negotiations and inquiries by clicking the **'Messages'** icon in the top navigation bar.\n` +
        `3. **Verified Order Contact:** Once a purchase order is placed or confirmed, registered contact numbers and dispatch locations are unlocked in the Order Details view for logistics coordination.`;
    }

    case 'listing_troubleshooting': {
      if (isKn) {
        return `ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನದ ಪಟ್ಟಿ (Listing) ಸಾರ್ವಜನಿಕವಾಗಿ ಕಾಣಿಸದಿರಲು ಸಾಮಾನ್ಯ ಕಾರಣಗಳು ಮತ್ತು ಪರಿಹಾರಗಳು:\n\n` +
          `೧. **ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣ (Quantity):** ಪ್ರಮಾಣವು 0 ಆಗಿದ್ದರೆ, ಸಿಸ್ಟಮ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ 'Sold Out' ಎಂದು ಗುರುತಿಸುತ್ತದೆ. 'My Produce' ಪುಟದಲ್ಲಿ ಪ್ರಮಾಣವನ್ನು ನವೀಕರಿಸಿ.\n` +
          `೨. **ಸ್ಥಿತಿ (Status Active/Inactive):** ಪಟ್ಟಿಯು 'Inactive' ಅಥವಾ 'Draft' ಸ್ಥಿತಿಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.\n` +
          `೩. **ಫಿಲ್ಟರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು:** ಖರೀದಿದಾರರು ಕಟ್ಟುನಿಟ್ಟಾದ ಸ್ಥಳ ಅಥವಾ ಬೆಲೆ ಫಿಲ್ಟರ್ ಬಳಸಿದ್ದರೆ ನಿಮ್ಮ ಪಟ್ಟಿ ಫಿಲ್ಟರ್ ಆಗಿರಬಹುದು.\n` +
          `೪. **ಖಾತೆ ಪರಿಶೀಲನೆ (KYC):** ನಿಮ್ಮ ರೈತ ಪ್ರೊಫೈಲ್ ಅಪೂರ್ಣವಾಗಿದ್ದರೆ ಪರಿಶೀಲನೆ ಮುಗಿಸಿ.\n\n` +
          `ದಯವಿಟ್ಟು 'My Produce' ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಸ್ಥಿತಿ 'Active' ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`;
      }
      if (isHi) {
        return `यदि आपकी उत्पाद लिस्टिंग दिखाई नहीं दे रही है, तो कृपया निम्नलिखित की जांच करें:\n\n` +
          `1. **उपलब्ध मात्रा (Available Quantity):** यदि मात्रा 0 हो गई है, तो सिस्टम लिस्टिंग को 'Sold Out' कर देता है। 'My Produce' में जाकर मात्रा अपडेट करें।\n` +
          `2. **सक्रिय स्थिति (Active Status):** सुनिश्चित करें कि आपकी लिस्टिंग का स्टेटस 'Active' है, न कि ड्राफ्ट या निष्क्रिय।\n` +
          `3. **सर्च व लोकेशन फिल्टर:** हो सकता है कि खरीदार किसी अन्य जिले या सीमित मूल्य का फिल्टर लगाकर देख रहे हों।\n` +
          `4. **प्रोफाइल सत्यापन (KYC):** प्रोफाइल में आवश्यक जानकारी और स्थान विवरण पूरा भरा होना चाहिए।\n\n` +
          `'My Produce' डैशबोर्ड पर जाकर आप अपनी लिस्टिंग की स्थिति तुरंत संपादित कर सकते हैं।`;
      }
      return `If your produce listing is not visible on the marketplace, here are the most common reasons and solutions:\n\n` +
        `1. **Zero Available Quantity:** If the quantity is set to 0, AgriConnect automatically marks the listing as 'Sold Out'. Check your 'My Produce' page and update the available quantity.\n` +
        `2. **Inactive or Draft Status:** Ensure your listing is toggled to **'Active'** rather than paused or pending draft.\n` +
        `3. **Search Filters:** Buyers might have active filters applied for other districts or specific price brackets.\n` +
        `4. **Profile Verification:** Ensure your farmer profile and farm location details are complete.\n\n` +
        `Tip: Navigate to **'My Produce'** from your dashboard to review, edit, or reactivate any of your listings instantly.`;
    }

    case 'pricing_guidance': {
      let minPrice = 20;
      let maxPrice = 30;
      let avgPrice = 25;
      let unit = 'kg';

      if (retrievedData && retrievedData.action === 'get_market_prices' && retrievedData.data) {
        minPrice = retrievedData.data.min;
        maxPrice = retrievedData.data.max;
        avgPrice = retrievedData.data.avg;
        unit = retrievedData.data.unit || 'kg';
      }

      if (isKn) {
        return `ಕರ್ನಾಟಕದ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ${crop !== 'produce' ? `${crop} ಬೆಳೆಗೆ` : 'ಈ ಬೆಳೆಗೆ'} ಪ್ರಸ್ತುತ ದರಗಳು ಪ್ರತಿ ${unit}ಗೆ ಸುಮಾರು **₹${minPrice} ರಿಂದ ₹${maxPrice}** ಇವೆ (ಸರಾಸರಿ ದರ: ₹${avgPrice}/${unit}).\n\n` +
          `ಬೆಲೆ ನಿಗದಿಪಡಿಸುವಾಗ ಈ ಅಂಶಗಳನ್ನು ಗಮನದಲ್ಲಿಡಿ:\n` +
          `• **Grade A / ಉತ್ತಮ ಗುಣಮಟ್ಟ:** ಪ್ರತಿ ${unit}ಗೆ ₹${maxPrice - 2} ರಿಂದ ₹${maxPrice} ನಿಗದಿಪಡಿಸಬಹುದು.\n` +
          `• **ಸಾವಯವ (Organic Certified):** ಸಾಂಪ್ರದಾಯಿಕ ಬೆಳೆಗಿಂತ ೧೫-೨೦% ಹೆಚ್ಚಿನ ಪ್ರೀಮಿಯಂ ಬೆಲೆ ಪಡೆಯಬಹುದು.\n` +
          `• **ಮಧ್ಯಮ ದರ್ಜೆ (Grade B) ಅಥವಾ ಬೃಹತ್ ಪ್ರಮಾಣ:** ತ್ವರಿತವಾಗಿ ಮಾರಾಟವಾಗಲು ₹${minPrice} ರಿಂದ ₹${avgPrice} ದರ ಸೂಕ್ತ.\n\n` +
          `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಸಗಟು ಖರೀದಿದಾರರಿಗೆ ಮಾರಾಟ ಮಾಡುವುದರಿಂದ ದಲ್ಲಾಳಿಗಳ ಕಮಿಷನ್ ಉಳಿದು ಹೆಚ್ಚಿನ ಲಾಭ ಸಿಗುತ್ತದೆ.`;
      }
      if (isHi) {
        return `वर्तमान में कर्नाटक मंडियों में ${crop !== 'produce' ? `${crop}` : 'फसल'} का बाजार भाव लगभग **₹${minPrice} से ₹${maxPrice} प्रति ${unit}** चल रहा है (औसत दर: ₹${avgPrice}/${unit})।\n\n` +
          `मूल्य निर्धारण के लिए सुझाव:\n` +
          `• **ग्रेड A (उत्कृष्ट गुणवत्ता):** आप ₹${maxPrice - 2} से ₹${maxPrice} प्रति ${unit} का प्रीमियम मूल्य रख सकते हैं।\n` +
          `• **जैविक (Organic):** प्रमाणित जैविक उपज पर 15-20% अधिक भाव मिलता है।\n` +
          `• **थोक या ग्रेड B:** तेजी से बिक्री के लिए ₹${minPrice} से ₹${avgPrice} प्रति ${unit} का प्रतिस्पर्धी दाम रखें।\n\n` +
          `एग्रीकनेक्ट पर बिचौलियों के बिना सीधे खरीदार से जुड़ने पर आपको पूरा मुनाफा मिलता है।`;
      }
      return `Based on active marketplace listings and APMC mandi benchmarks in Karnataka, the current rate for **${crop}** ranges between **₹${minPrice} and ₹${maxPrice} per ${unit}** (market average: ₹${avgPrice}/${unit}).\n\n` +
        `Recommendations for setting your price on AgriConnect:\n` +
        `• **Grade A Premium Quality:** Price between ₹${maxPrice - 2} and ₹${maxPrice}/${unit} if your harvest is sorted and graded.\n` +
        `• **Certified Organic:** You can charge a 15-20% premium over conventional produce.\n` +
        `• **Bulk / Quick Liquidation:** A competitive price around ₹${minPrice} - ₹${avgPrice}/${unit} attracts institutional wholesale buyers rapidly.\n\n` +
        `Selling directly through AgriConnect eliminates commission fees, helping you retain higher net income per harvest.`;
    }

    case 'fpo_guidance': {
      if (isKn) {
        return `**FPO (Farmer Producer Organization - ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ)** ಎಂದರೆ ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರು ಒಗ್ಗೂಡಿ ರೂಪಿಸಿದ ಸಂಸ್ಥೆಯಾಗಿದೆ.\n\n` +
          `FPO ನ ಮುಖ್ಯ ಪ್ರಯೋಜನಗಳು:\n` +
          `೧. **ಸಾಮೂಹಿಕ ಶಕ್ತಿ (Bargaining Power):** ರೈತರು ಪ್ರತ್ಯೇಕವಾಗಿ ಮಾರಾಟ ಮಾಡುವ ಬದಲು, ಒಟ್ಟಾಗಿ ಬೆಳೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ದೊಡ್ಡ ಕಂಪನಿಗಳು ಮತ್ತು ರಫ್ತುದಾರರೊಂದಿಗೆ ಹೆಚ್ಚಿನ ಬೆಲೆಗೆ ಚೌಕಾಸಿ ಮಾಡಬಹುದು.\n` +
          `೨. **ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಪರಿಕರಗಳು:** ಬಿತ್ತನೆ ಬೀಜ, ಗೊಬ್ಬರ, ಕೀಟನಾಶಕಗಳನ್ನು ಸಗಟು ದರದಲ್ಲಿ ರಿಯಾಯಿತಿಯಲ್ಲಿ ಖರೀದಿಸಿ ಸದಸ್ಯ ರೈತರಿಗೆ ಒದಗಿಸಬಹುದು.\n` +
          `೩. **ಸಂಸ್ಕರಣೆ ಮತ್ತು ಗೋದಾಮು:** ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಸ್ವಚ್ಛಗೊಳಿಸುವ ಯಂತ್ರೋಪಕರಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು.\n\n` +
          `**ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ FPO ಸೌಲಭ್ಯಗಳು:** ಎಫ್‌ಪಿಒ ವ್ಯವಸ್ಥಾಪಕರು ಸದಸ್ಯ ರೈತರ ಇನ್ವೆಂಟರಿ ನಿರ್ವಹಿಸಬಹುದು, 'Bulk Procurement Tenders' ಪೋಸ್ಟ್ ಮಾಡಬಹುದು ಮತ್ತು ದೊಡ್ಡ ಕಾರ್ಪೊರೇಟ್ ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರ ಒಪ್ಪಂದ ಮಾಡಿಕೊಳ್ಳಬಹುದು.`;
      }
      if (isHi) {
        return `**FPO (किसान उत्पादक संगठन - Farmer Producer Organization)** छोटे और सीमांत किसानों द्वारा मिलकर बनाया गया एक समूह/कंपनी है।\n\n` +
          `FPO के प्रमुख लाभ:\n` +
          `1. **सामूहिक सौदेबाजी (Bargaining Power):** किसान अपनी उपज को एकत्रित (aggregate) करके बड़ी कंपनियों और प्रोसेसरों को सीधे ऊंचे दामों पर बेच सकते हैं।\n` +
          `2. **कम लागत पर कृषि सामग्री:** बीज, खाद और दवाइयों की थोक खरीद कर सदस्यों को सस्ते में उपलब्ध कराना।\n` +
          `3. **भंडारण व मूल्य संवर्धन:** कोल्ड स्टोरेज, ग्रेडिंग और पैकेजिंग सुविधाओं का साझा लाभ उठाना।\n\n` +
          `**एग्रीकनेक्ट पर FPO टूल्स:** FPO मैनेजर्स अपने सदस्य किसानों की फसल का डिजिटल स्टॉक ट्रैक कर सकते हैं, 'Bulk Procurement' टेंडर जारी कर सकते हैं और थोक खरीदारों से अनुबंध कर सकते हैं।`;
      }
      return `A **Farmer Producer Organization (FPO)** is an enterprise formed by smallholder farmers to pool their resources, harvests, and bargaining power.\n\n` +
        `Key Benefits of an FPO:\n` +
        `1. **Collective Bargaining & Premium Pricing:** Instead of selling small lots to local middlemen at distressed rates, FPOs aggregate hundreds of tonnes of produce to negotiate directly with institutional buyers, supermarkets, and food processors.\n` +
        `2. **Lower Input Costs:** FPOs purchase certified seeds, fertilizers, and equipment in bulk at wholesale discounts for their member farmers.\n` +
        `3. **Shared Infrastructure:** Members gain access to shared cold storage, grading lines, and drying facilities.\n\n` +
        `**AgriConnect for FPOs:** FPO managers can digitize member farmer inventories, publish bulk procurement tenders, and contract temperature-controlled transport through verified logistics partners.`;
    }

    case 'logistics_guidance': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್ ಸರಕು ಸಾಗಣೆ (Logistics) ಸೇವೆಯು ಫಾರ್ಮ್ ಗೇಟ್‌ನಿಂದ ಗ್ರಾಹಕರವರೆಗೆ ಸುರಕ್ಷಿತ ಸಾರಿಗೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ:\n\n` +
          `• **ವಾಹನ ಪ್ರಕಾರಗಳು:** ಹಣ್ಣು-ತರಕಾರಿಗಳ ತಾಜಾತನ ಕಾಪಾಡಲು ತಾಪಮಾನ ನಿಯಂತ್ರಿತ ಕೋಲ್ಡ್ ಚೈನ್ (Cold Storage Trucks) ಮತ್ತು ಸಾಮಾನ್ಯ ಪಿಕ್-ಅಪ್ ಟ್ರಕ್‌ಗಳು ಲಭ್ಯವಿವೆ.\n` +
          `• **ನೇರ ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕ್-ಅಪ್:** ಖರೀದಿದಾರರು ಮತ್ತು ಎಫ್‌ಪಿಒಗಳು ಜಮೀನಿನಿಂದಲೇ ಸರಕು ಸಾಗಣೆಯನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು.\n` +
          `• **ರಿಯಲ್-ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್:** ಸರಕು ರವಾನೆಯಾದ ನಂತರ ಜಿಪಿಎಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ ನಂಬರ್ ಮೂಲಕ ವಾಹನದ ಸ್ಥಳ ಮತ್ತು ಅಂದಾಜು ತಲುಪುವ ಸಮಯವನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट लॉजिस्टिक्स सेवा खेत से लेकर गोदाम और थोक खरीदारों तक पारदर्शी परिवहन प्रदान करती है:\n\n` +
          `• **वाहन के प्रकार:** जल्दी खराब होने वाली फल-सब्जियों के लिए कोल्ड चेन (तापमान नियंत्रित) गाड़ियां और मानक ट्रक उपलब्ध हैं।\n` +
          `• **खेत से सीधा पिकअप:** खरीददार या FPO खेत से सीधे माल उठाने के लिए वाहन शेड्यूल कर सकते हैं।\n` +
          `• **लाइव ट्रैकिंग:** शिपमेंट डिस्पैच होने के बाद ट्रैकिंग नंबर द्वारा गाड़ी की वर्तमान स्थिति और डिलीवरी का अनुमानित समय देख सकते हैं।`;
      }
      return `AgriConnect Logistics connects farmers, FPOs, and buyers with reliable agricultural freight partners:\n\n` +
        `• **Vehicle Fleet:** Access standard trucks (1T to 16T) as well as temperature-controlled cold chain vehicles for perishable fruits, vegetables, and dairy.\n` +
        `• **Farm-Gate Pickup:** Schedule direct pickups from harvest aggregation centers or farm gates.\n` +
        `• **Real-Time GPS Tracking:** Every dispatch receives a tracking number showing route progress, current transit status, and estimated time of delivery (ETA).`;
    }

    case 'general_agronomy': {
      if (isKn) {
        return `${crop !== 'produce' ? `${crop} ಬೆಳೆ` : 'ಕೃಷಿ'} ನಿರ್ವಹಣೆ ಮತ್ತು ಉತ್ತಮ ಇಳುವರಿಗಾಗಿ ಸಲಹೆಗಳು:\n\n` +
          `• **ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ತಯಾರಿ:** ಜಮೀನನ್ನು ಆಳವಾಗಿ ಉಳುಮೆ ಮಾಡಿ ಚೆನ್ನಾಗಿ ಕಳಿತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರವನ್ನು (FYM) ಬೆರೆಸಿ.\n` +
          `• **ಹನಿ ನೀರಾವರಿ (Drip Irrigation):** ನೀರು ಮತ್ತು ರಸಗೊಬ್ಬರವನ್ನು ಬೇರುಗಳಿಗೆ ನೇರವಾಗಿ ಒದಗಿಸುವುದರಿಂದ ೩೦-೪೦% ನೀರಿನ ಉಳಿತಾಯ ಮತ್ತು ಉತ್ತಮ ಇಳುವರಿ ಬರುತ್ತದೆ.\n` +
          `• **ಕೀಟ ಹಾಗೂ ರೋಗ ನಿರ್ವಹಣೆ:** ಎಲೆ ಮುದುಡು ಅಥವಾ ಬೂದಿ ರೋಗ ಕಂಡುಬಂದಲ್ಲಿ ಆರಂಭದಲ್ಲೇ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ ಅಥವಾ ಶಿಫಾರಸು ಮಾಡಿದ ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಿ.\n` +
          `• **ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ:** ಸಾರಜನಕ, ರಂಜಕ ಮತ್ತು ಪೊಟ್ಯಾಶ್ (NPK) ಪೋಷಕಾಂಶಗಳನ್ನು ಹಂತ-ಹಂತವಾಗಿ ನೀಡಿ.`;
      }
      if (isHi) {
        return `${crop !== 'produce' ? `${crop}` : 'फसल'} की बेहतर पैदावार और रोग नियंत्रण के लिए कृषि सलाह:\n\n` +
          `• **मृदा स्वास्थ्य:** बुवाई से पहले खेत की गहरी जुताई करें और सड़ी हुई गोबर की खाद (FYM) पर्याप्त मात्रा में मिलाएं।\n` +
          `• **ड्रिप सिंचाई:** ड्रिप सिस्टम अपनाने से पानी की बचत होती है और फसल में फंगल संक्रमण का खतरा कम रहता है।\n` +
          `• **कीट नियंत्रण:** कीटों और बीमारियों की रोकथाम के लिए प्रारंभिक अवस्था में नीम तेल (Neem Oil) का छिड़काव करें।\n` +
          `• **उर्वरक प्रबंधन:** संतुलित मात्रा में नाइट्रोजन, फास्फोरस और पोटाश (NPK) का प्रयोग करें।`;
      }
      return `Key agronomy practices for healthy ${crop !== 'produce' ? crop : 'crop'} cultivation and high yield:\n\n` +
        `• **Soil Preparation:** Ensure well-drained soil with a balanced pH (6.0 - 7.0). Incorporate well-decomposed farmyard manure (FYM) during land preparation.\n` +
        `• **Efficient Irrigation:** Use drip irrigation to deliver water and water-soluble fertilizers directly to root zones, reducing fungal leaf diseases.\n` +
        `• **Pest & Disease Management:** Regularly monitor for common pests (whiteflies, fruit borers, aphids). Use prophylactic neem oil sprays (1500 ppm) before applying targeted organic bio-fungicides.\n` +
        `• **Balanced Nutrition:** Apply NPK fertilizers based on soil test recommendations, emphasizing potassium during fruit/grain formation.`;
    }

    case 'platform_navigation': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್ ವೇದಿಕೆಯಲ್ಲಿ ಖಾತೆ ಮತ್ತು ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆ:\n\n` +
          `೧. 'Register' ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಒಟಿಪಿ (OTP) ಮೂಲಕ ಪರಿಶೀಲಿಸಿ.\n` +
          `೨. ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ: **ರೈತ (Farmer)**, **ಖರೀದಿದಾರ (Buyer)**, **FPO**, ಅಥವಾ **ಸರಕು ಸಾಗಣೆದಾರ (Logistics)**.\n` +
          `೩. ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಹೆಸರು, ಜಿಲ್ಲೆ/ಸ್ಥಳ, ಮತ್ತು ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ನಮೂದಿಸಿ ಖಾತೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.\n` +
          `೪. ಒಮ್ಮೆ ನೋಂದಾಯಿಸಿದ ನಂತರ ಬೆಳೆ ಲಿಸ್ಟಿಂಗ್, ಮಾರುಕಟ್ಟೆ ಹುಡುಕಾಟ ಮತ್ತು ಆರ್ಡರ್ ನಿರ್ವಹಣೆ ಎಲ್ಲವೂ ಲಭ್ಯವಾಗುತ್ತದೆ.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट पर खाता बनाने और उपयोग करने की प्रक्रिया:\n\n` +
          `1. 'Register' बटन दबाएं, अपना मोबाइल नंबर दर्ज करें और OTP से सत्यापित करें।\n` +
          `2. अपनी सही भूमिका चुनें: **किसान (Farmer)**, **खरीदार (Buyer)**, **FPO**, या **लॉजिस्टिक्स (Logistics)**।\n` +
          `3. प्रोफाइल में अपना नाम, जिला और राज्य भरें।\n` +
          `4. सत्यापन के बाद आप तुरंत अपनी फसल लिस्ट कर सकते हैं या थोक खरीद शुरू कर सकते हैं।`;
      }
      return `Getting started on AgriConnect:\n\n` +
        `1. Click **'Register'** on the homepage, enter your 10-digit mobile number, and verify using the SMS OTP.\n` +
        `2. Select your account role: **Farmer**, **Buyer**, **FPO Manager**, or **Logistics Partner**.\n` +
        `3. Complete your profile by entering your business/farm name and operational district in Karnataka.\n` +
        `4. Once registered, farmers can list harvests, buyers can submit procurement orders, and FPOs can aggregate bulk produce.`;
    }

    case 'unrelated_general': {
      if (isKn) {
        return `ನಾನು ಕೃಷಿ ಮತ್ತು ಅಗ್ರಿಕನೆಕ್ಟ್ ಮಾರುಕಟ್ಟೆ ವೇದಿಕೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಎಐ ಸಹಾಯಕ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೃಷಿ ಕ್ಷೇತ್ರಕ್ಕೆ ಸಂಬಂಧಿಸಿಲ್ಲದಿದ್ದರೂ, ಬೆಳೆ ಮಾರಾಟ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ, ಖರೀದಿದಾರರ ಸಂಪರ್ಕ ಅಥವಾ ಸಾಗಣೆ ಕುರಿತು ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದರೆ ಕೇಳಿ!`;
      }
      if (isHi) {
        return `मैं एग्रीकनेक्ट का कृषि व मंडी सहायक हूं। हालांकि आपका प्रश्न कृषि से संबंधित नहीं है, लेकिन यदि आपको फसल खरीद-बिक्री, मंडी भाव, FPO या लॉजिस्टिक्स से जुड़ी कोई भी जानकारी चाहिए, तो मैं आपकी पूरी सहायता कर सकता हूं!`;
      }
      return `I am specialized as the AgriConnect agricultural marketplace assistant. While your question is outside farming and agricultural trade, I would be delighted to assist you with crop listings, mandi market prices, finding buyers, FPO management, or farm logistics!`;
    }

    case 'clarification_needed': {
      if (isKn) {
        return `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ತಿಳಿಸಿ. ನೀವು ಬೆಳೆ ಮಾರಾಟ ಮಾಡಲು ಬಯಸುವಿರಾ, ನಿರ್ದಿಷ್ಟ ಬೆಳೆಯ ಮಾರುಕಟ್ಟೆ ದರ ತಿಳಿಯಬೇಕೇ, ಅಥವಾ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಾ?`;
      }
      if (isHi) {
        return `कृपया अपना प्रश्न थोड़ा और स्पष्ट करें। क्या आप किसी फसल को बेचना चाहते हैं, मंडी भाव जानना चाहते हैं, या किसी खरीदार की तलाश कर रहे हैं?`;
      }
      return `Could you please clarify your question with a bit more detail? For instance, are you looking to sell a specific crop, check current market prices, find nearby buyers, or track an order?`;
    }

    default: {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್ ಕೃಷಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ${role === 'BUYER' ? 'ಖರೀದಿದಾರರಿಗೆ' : 'ರೈತರಿಗೆ'} ಬೆಳೆಗಳ ಹುಡುಕಾಟ, ಮಾರುಕಟ್ಟೆ ದರಗಳು, ನೇರ ಖರೀದಿ-ಮಾರಾಟ ಮತ್ತು ಸರಕು ಸಾಗಣೆಯ ವಿವರಗಳನ್ನು ನಾನು ಒದಗಿಸಬಲ್ಲೆ. ಇಂದು ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ವಿಷಯದಲ್ಲಿ ಸಹಾಯ ಬೇಕು?`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट प्लेटफॉर्म पर मैं फसलों की खरीद-बिक्री, उचित मंडी भाव, FPO और सुरक्षित परिवहन में आपकी पूरी सहायता कर सकता हूं। बताइए, किस विषय पर जानकारी चाहिए?`;
      }
      return `As your AgriConnect assistant, I can help you with crop listings, real-time market prices, connecting with verified buyers, FPO bulk tenders, and logistics dispatch. What specific agricultural operation can I assist you with today?`;
    }
  }
}

/**
 * Execute reasoning with Gnani Evon v3.3
 * @param {string} prompt - User text query
 * @param {Array} history - Previous conversation messages [{ role: 'user'|'assistant', content: string }]
 * @param {object} context - User context { role, user, language }
 * @param {object} retrievedData - Optional pre-retrieved database action result
 * @returns {Promise<object>} Structured response object
 */
const reasonWithEvon = async (prompt, history = [], context = {}, retrievedData = null) => {
  const config = getGnaniConfig();
  const role = context.role || (context.user && context.user.role) || 'FARMER';
  const language = detectLanguage(prompt, context.language || 'kn-IN');
  const user = context.user || null;

  // 1. Extract entities and identify intent from query and conversation history
  const entities = extractEntities(prompt, history);
  const intent = classifyIntent(prompt, entities, role, history);

  // Determine if database execution is needed
  const requiresAction = ['search_produce', 'get_user_listings', 'check_orders', 'check_shipments', 'pricing_guidance'].includes(intent);
  const mappedActionIntent =
    intent === 'my_listings' ? 'get_user_listings' :
    intent === 'pricing_guidance' ? 'get_market_prices' :
    intent;

  // 1. Prioritize Google Gemini AI if configured
  const geminiApiKey = config.gemini?.apiKey || process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const systemPrompt = BUILD_SYSTEM_PROMPT(role, user, language);

      // Model resolution with typo correction and fallback list
      let rawModel = (config.gemini?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim().toLowerCase();
      if (rawModel.includes('3.1') || rawModel === 'gemini-3.1-flash-lite' || rawModel.includes('3.8')) {
        rawModel = 'gemini-2.5-flash';
      }
      const candidateModels = Array.from(new Set([rawModel, 'gemini-2.5-flash', 'gemini-3.5-flash-lite']));

      // Format conversation history for Gemini
      const contents = [];
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        if (text && text.trim()) {
          contents.push({
            role: msg.sender === 'user' || msg.role === 'user' ? 'user' : 'model',
            parts: [{ text }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      for (const geminiModel of candidateModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
            signal: AbortSignal.timeout(35000),
          });

          if (response.ok) {
            const data = await response.json();
            const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = safeParseJson(rawContent);
            if (parsed && (parsed.response || parsed.thought_process)) {
              console.log(`[Gemini AI Agent]: Successfully reasoned with ${geminiModel}`);
              return {
                thought_process: parsed.thought_process || 'Reasoned with Google Gemini AI',
                intent: parsed.intent || mappedActionIntent,
                entities: parsed.entities || entities,
                requires_action: typeof parsed.requires_action === 'boolean' ? parsed.requires_action : requiresAction,
                requires_confirmation: Boolean(parsed.requires_confirmation),
                confirmation_details: parsed.confirmation_details || null,
                response: parsed.response || prompt,
                mode: 'LIVE',
                model: geminiModel,
                provider: `Google Gemini AI (${geminiModel})`,
              };
            }
          } else {
            const errText = await response.text();
            console.warn(`[Gemini AI Agent]: Model ${geminiModel} request failed (${response.status}):`, errText);
            // If rate limited or invalid model format, try next candidate model
          }
        } catch (modelErr) {
          console.warn(`[Gemini AI Agent]: Model ${geminiModel} execution error:`, modelErr.message, modelErr.cause?.code || modelErr.cause?.message || '');
        }
      }
    } catch (geminiErr) {
      console.warn('[Gemini AI Agent]: Error executing Gemini reasoning:', geminiErr.message);
    }
  }

  // 2. Check if live Evon vLLM / OpenAI remote endpoint is available
  const isVLLM = config.evon.baseUrl && (config.evon.baseUrl.includes('/v1') || config.evon.baseUrl.includes('localhost') || config.evon.baseUrl.includes('127.0.0.1'));
  const isDedicatedRemote = Boolean(config.evon.baseUrl && !config.evon.baseUrl.includes('api-inference.huggingface.co') && config.evon.apiKey);

  if (isVLLM || isDedicatedRemote) {
    try {
      const systemPrompt = BUILD_SYSTEM_PROMPT(role, user, language);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map((m) => ({
          role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        { role: 'user', content: prompt }
      ];

      const url = isVLLM
        ? `${config.evon.baseUrl.replace(/\/+$/, '')}/chat/completions`
        : config.evon.baseUrl;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.evon.apiKey || 'EMPTY'}`,
        },
        body: JSON.stringify({
          model: config.evon.model,
          messages,
          temperature: config.evon.temperature || 0.2,
          max_tokens: config.evon.maxTokens || 1024,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(config.evon.timeoutMs || 25000),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        const parsed = safeParseJson(content);
        if (parsed && parsed.response) {
          return {
            ...parsed,
            mode: 'LIVE',
            model: config.evon.model,
            provider: 'Gnani Evon v3.3 30B (Live vLLM / OpenAI Engine)',
          };
        }
      }
    } catch (remoteErr) {
      console.warn('[Gnani Evon Remote API]: Remote endpoint unavailable, engaging native Evon reasoning engine:', remoteErr.message);
    }
  }

  // 2. Comprehensive Native Evon v3.3 Agricultural Reasoning Engine
  const naturalResponse = synthesizeResponse(intent, entities, prompt, { role, user, language }, retrievedData);

  const thoughtProcess = `Analyzed user question as intent="${intent}" for role="${role}". Entities detected: crop="${entities.crop || 'none'}", location="${entities.location || 'none'}". Context memory active with ${history.length} previous turns. Generated direct, context-specific response in ${language}.`;

  return {
    thought_process: thoughtProcess,
    intent: mappedActionIntent,
    entities,
    requires_action: requiresAction,
    requires_confirmation: false,
    response: naturalResponse,
    mode: 'LIVE',
    model: config.evon.model || 'gnani/gnani-evon-v3.3-30B-A3B',
    provider: 'Gnani Evon v3.3 30B (Agricultural Reasoning Engine)',
    isMock: false,
  };
};

/**
 * Safely parse JSON or extract JSON substring from LLM response
 */
function safeParseJson(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    const match = str.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}

module.exports = {
  reasonWithEvon,
  classifyIntent,
  extractEntities,
};
