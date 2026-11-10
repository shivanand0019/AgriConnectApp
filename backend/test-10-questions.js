/**
 * Comprehensive Test Suite for AgriConnect AI Assistant
 * Verifies 10 Specific Scenarios required by the project:
 *  1. General agricultural question (Agronomy / Pest / Irrigation)
 *  2. Farmer marketplace question (How to sell / list produce)
 *  3. Buyer marketplace question (Finding buyers / Procurement)
 *  4. FPO-related question (What is an FPO / Collective bargaining)
 *  5. Logistics question (Cold chain / Freight transport)
 *  6. Product listing troubleshooting (Listing visibility / Inactive / Sold out)
 *  7. Follow-up question with Conversation Memory (Turn 1: "I want to sell tomatoes" -> Turn 2: "What price should I set?")
 *  8. Kannada native question ("ಮೈಸೂರಿನಲ್ಲಿ ಟೊಮ್ಯಾಟೊ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ")
 *  9. Hindi native question ("टमाटर बेचने के लिए क्या प्रक्रिया है?")
 * 10. Unrelated general question ("What is the capital of France?")
 * Bonus 11: Real MongoDB produce search integration ("Find available onion listings")
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/config.env') });
const app = require('./app');

async function run10QuestionSuite() {
  console.log('===============================================================');
  console.log('🌱 AGRICONNECT AI ASSISTANT: 10 SCENARIO VERIFICATION SUITE 🌱');
  console.log('===============================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(8098, resolve));
  const baseUrl = 'http://localhost:8098/api/ai';

  const results = [];

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: General agricultural question
    // -------------------------------------------------------------------------
    console.log('--- [Q1] General Agricultural Question ---');
    const q1Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How to manage tomato blight and irrigation?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const q1Data = await q1Res.json();
    console.log('Intent:', q1Data.data.reasoning.intent);
    console.log('Crop detected:', q1Data.data.reasoning.entities.crop);
    console.log('Response excerpt:', q1Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q1: General Agricultural Question',
      intent: q1Data.data.reasoning.intent,
      expectedIntent: 'general_agronomy',
      passed: q1Data.data.reasoning.intent === 'general_agronomy' && q1Data.data.assistantResponse.toLowerCase().includes('irrigation'),
      responseExcerpt: q1Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 2: Farmer marketplace question
    // -------------------------------------------------------------------------
    console.log('--- [Q2] Farmer Marketplace Question ---');
    const q2Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How can I sell tomatoes?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const q2Data = await q2Res.json();
    console.log('Intent:', q2Data.data.reasoning.intent);
    console.log('Crop detected:', q2Data.data.reasoning.entities.crop);
    console.log('Response excerpt:', q2Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q2: Farmer Marketplace Question',
      intent: q2Data.data.reasoning.intent,
      expectedIntent: 'how_to_sell',
      passed: q2Data.data.reasoning.intent === 'how_to_sell' && q2Data.data.assistantResponse.includes('List Produce'),
      responseExcerpt: q2Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 3: Buyer marketplace question
    // -------------------------------------------------------------------------
    console.log('--- [Q3] Buyer Marketplace Question ---');
    const q3Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How can I find buyers near me?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const q3Data = await q3Res.json();
    console.log('Intent:', q3Data.data.reasoning.intent);
    console.log('Response excerpt:', q3Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q3: Buyer Marketplace Question',
      intent: q3Data.data.reasoning.intent,
      expectedIntent: 'find_buyers',
      passed: q3Data.data.reasoning.intent === 'find_buyers' && q3Data.data.assistantResponse.includes('Procurement'),
      responseExcerpt: q3Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 4: FPO-related question
    // -------------------------------------------------------------------------
    console.log('--- [Q4] FPO-Related Question ---');
    const q4Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is an FPO and how does it help farmers?',
        language: 'en-IN',
        role: 'FPO',
        skipTTS: true,
      }),
    });
    const q4Data = await q4Res.json();
    console.log('Intent:', q4Data.data.reasoning.intent);
    console.log('Response excerpt:', q4Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q4: FPO-Related Question',
      intent: q4Data.data.reasoning.intent,
      expectedIntent: 'fpo_guidance',
      passed: q4Data.data.reasoning.intent === 'fpo_guidance' && q4Data.data.assistantResponse.includes('Farmer Producer Organization'),
      responseExcerpt: q4Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 5: Logistics question
    // -------------------------------------------------------------------------
    console.log('--- [Q5] Logistics Question ---');
    const q5Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'How does temperature-controlled delivery and logistics work?',
        language: 'en-IN',
        role: 'LOGISTICS',
        skipTTS: true,
      }),
    });
    const q5Data = await q5Res.json();
    console.log('Intent:', q5Data.data.reasoning.intent);
    console.log('Response excerpt:', q5Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q5: Logistics Question',
      intent: q5Data.data.reasoning.intent,
      expectedIntent: 'logistics_guidance',
      passed: q5Data.data.reasoning.intent === 'logistics_guidance' && q5Data.data.assistantResponse.toLowerCase().includes('cold chain'),
      responseExcerpt: q5Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 6: Product listing question
    // -------------------------------------------------------------------------
    console.log('--- [Q6] Product Listing Troubleshooting ---');
    const q6Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Why is my listing not visible?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const q6Data = await q6Res.json();
    console.log('Intent:', q6Data.data.reasoning.intent);
    console.log('Response excerpt:', q6Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q6: Listing Troubleshooting',
      intent: q6Data.data.reasoning.intent,
      expectedIntent: 'listing_troubleshooting',
      passed: q6Data.data.reasoning.intent === 'listing_troubleshooting' && q6Data.data.assistantResponse.includes('Sold Out'),
      responseExcerpt: q6Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 7: Follow-up question with conversation memory
    // -------------------------------------------------------------------------
    console.log('--- [Q7] Follow-up Question with Memory ---');
    const memorySessionId = `test-session-${Date.now()}`;

    // Turn 1: User mentions tomatoes
    console.log('Turn 1: "I want to sell tomatoes."');
    const turn1Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: memorySessionId,
        query: 'I want to sell tomatoes.',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const turn1Data = await turn1Res.json();
    console.log('Turn 1 Intent:', turn1Data.data.reasoning.intent, '| Crop:', turn1Data.data.reasoning.entities.crop);

    // Turn 2: Follow-up "What price should I set?" (does NOT repeat the word "tomatoes")
    console.log('Turn 2: "What price should I set?" (omits crop)');
    const turn2Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: memorySessionId,
        query: 'What price should I set?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const turn2Data = await turn2Res.json();
    console.log('Turn 2 Intent:', turn2Data.data.reasoning.intent);
    console.log('Turn 2 Inherited Crop:', turn2Data.data.reasoning.entities.crop);
    console.log('Turn 2 Response excerpt:', turn2Data.data.assistantResponse.substring(0, 150) + '...\n');
    const memoryPassed =
      turn2Data.data.reasoning.entities.crop === 'tomato' &&
      turn2Data.data.assistantResponse.toLowerCase().includes('tomato');
    results.push({
      scenario: 'Q7: Follow-up Question with Memory',
      intent: turn2Data.data.reasoning.intent,
      expectedIntent: 'get_market_prices',
      inheritedCrop: turn2Data.data.reasoning.entities.crop,
      passed: memoryPassed,
      responseExcerpt: turn2Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 8: Kannada Question
    // -------------------------------------------------------------------------
    console.log('--- [Q8] Kannada Question ---');
    const q8Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'ಮೈಸೂರಿನಲ್ಲಿ ಟೊಮ್ಯಾಟೊ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ',
        language: 'kn-IN',
        role: 'FARMER',
        skipTTS: false, // verify real Timbre TTS execution
      }),
    });
    const q8Data = await q8Res.json();
    console.log('Intent:', q8Data.data.reasoning.intent);
    console.log('Crop:', q8Data.data.reasoning.entities.crop);
    console.log('Location:', q8Data.data.reasoning.entities.location);
    console.log('TTS Generated:', Boolean(q8Data.data.tts?.audioBase64));
    console.log('Response excerpt:', q8Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q8: Kannada Question',
      intent: q8Data.data.reasoning.intent,
      expectedIntent: 'find_buyers',
      ttsGenerated: Boolean(q8Data.data.tts?.audioBase64),
      passed: q8Data.data.reasoning.intent === 'find_buyers' && /[\u0C80-\u0CFF]/.test(q8Data.data.assistantResponse),
      responseExcerpt: q8Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 9: Hindi Question
    // -------------------------------------------------------------------------
    console.log('--- [Q9] Hindi Question ---');
    const q9Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'टमाटर बेचने के लिए क्या प्रक्रिया है?',
        language: 'hi-IN',
        role: 'FARMER',
        skipTTS: false, // verify real Timbre TTS execution
      }),
    });
    const q9Data = await q9Res.json();
    console.log('Intent:', q9Data.data.reasoning.intent);
    console.log('Crop:', q9Data.data.reasoning.entities.crop);
    console.log('TTS Generated:', Boolean(q9Data.data.tts?.audioBase64));
    console.log('Response excerpt:', q9Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q9: Hindi Question',
      intent: q9Data.data.reasoning.intent,
      expectedIntent: 'how_to_sell',
      ttsGenerated: Boolean(q9Data.data.tts?.audioBase64),
      passed: q9Data.data.reasoning.intent === 'how_to_sell' && /[\u0900-\u097F]/.test(q9Data.data.assistantResponse),
      responseExcerpt: q9Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 10: Unrelated General Question
    // -------------------------------------------------------------------------
    console.log('--- [Q10] Unrelated General Question ---');
    const q10Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What is the capital of France?',
        language: 'en-IN',
        role: 'FARMER',
        skipTTS: true,
      }),
    });
    const q10Data = await q10Res.json();
    console.log('Intent:', q10Data.data.reasoning.intent);
    console.log('Response excerpt:', q10Data.data.assistantResponse.substring(0, 150) + '...\n');
    results.push({
      scenario: 'Q10: Unrelated General Question',
      intent: q10Data.data.reasoning.intent,
      expectedIntent: 'unrelated_general',
      passed: q10Data.data.reasoning.intent === 'unrelated_general' && q10Data.data.assistantResponse.includes('AgriConnect'),
      responseExcerpt: q10Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Scenario 11: Real MongoDB Database Produce Search
    // -------------------------------------------------------------------------
    console.log('--- [Q11] Live MongoDB Produce Query ---');
    const q11Res = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Find available onion listings in Ramanagara',
        language: 'en-IN',
        role: 'BUYER',
        skipTTS: true,
      }),
    });
    const q11Data = await q11Res.json();
    console.log('Intent:', q11Data.data.reasoning.intent);
    console.log('Crop:', q11Data.data.reasoning.entities.crop);
    console.log('Location:', q11Data.data.reasoning.entities.location);
    console.log('Action Result count:', q11Data.data.actionResult?.count);
    console.log('Response excerpt:', q11Data.data.assistantResponse.substring(0, 180) + '...\n');
    results.push({
      scenario: 'Q11: Live MongoDB Produce Query',
      intent: q11Data.data.reasoning.intent,
      expectedIntent: 'search_produce',
      dataCount: q11Data.data.actionResult?.count,
      passed: q11Data.data.reasoning.intent === 'search_produce' && Boolean(q11Data.data.actionResult?.data),
      responseExcerpt: q11Data.data.assistantResponse.substring(0, 120),
    });

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log('===============================================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('===============================================================');
    let allPassed = true;
    for (const r of results) {
      const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
      if (!r.passed) allPassed = false;
      console.log(`${statusIcon} | ${r.scenario} -> Intent: [${r.intent}]`);
      if (r.inheritedCrop) {
        console.log(`       Memory Inherited Crop: "${r.inheritedCrop}"`);
      }
      if (r.ttsGenerated !== undefined) {
        console.log(`       Timbre TTS Generated: ${r.ttsGenerated}`);
      }
      if (r.dataCount !== undefined) {
        console.log(`       MongoDB Records Found: ${r.dataCount}`);
      }
    }
    console.log('===============================================================');
    if (allPassed) {
      console.log('🎉 ALL 10 REQUIRED SCENARIOS (+ MONGODB QUERY) PASSED! 🎉');
    } else {
      console.error('⚠️ Some scenarios failed.');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run10QuestionSuite();

