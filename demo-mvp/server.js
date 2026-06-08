const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_ROOT = path.join(ROOT, 'public');

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  const tplPath = path.join(ROOT, 'OPENAI_CONFIG_TEMPLATE.txt');
  let content = '';
  if (fs.existsSync(envPath)) content = fs.readFileSync(envPath, 'utf8');
  else if (fs.existsSync(tplPath)) content = fs.readFileSync(tplPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const k = trimmed.slice(0, i).trim();
    const v = trimmed.slice(i + 1).trim();
    // Always refresh from local config file so updates take effect without restart.
    process.env[k] = v;
  }
}

loadEnv();

function sendJson(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(s)
  });
  res.end(s);
}

function hasUsableApiKey() {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && !key.includes('your_openai_api_key_here'));
}

function localInterviewReply({ role = 'Software Engineer', userAnswer = '', question = '', interviewType = 'behavioral' }) {
  const answer = String(userAnswer || '').toLowerCase();
  const asksMetric = !/\d|percent|%|user|latency|revenue|conversion|time|week|month/.test(answer);
  const asksOwnership = !/i |my |owned|led|built|designed|implemented|drove/.test(answer);
  let followUp = 'Thanks. What was your direct ownership and measurable impact?';

  if (asksOwnership) followUp = 'What part did you personally own, and what decision did you drive?';
  else if (asksMetric) followUp = 'Can you add one concrete metric that shows the result?';
  else if (/trade.?off|why|decision/i.test(question)) followUp = 'What alternative did you reject, and why was this choice better?';
  else if (/failure|changed/i.test(question)) followUp = 'What did you change afterward to prevent the same issue?';
  else if (/fit/i.test(question)) followUp = `Which strength makes you ready for this ${role} role from day one?`;

  return {
    followUp,
    recruiterLens: 'Local demo mode: answer is being evaluated with a simple offline rubric because no OpenAI API key is configured.',
    coachTip: 'Use a tighter STAR shape: situation, action you owned, measurable result.',
    polish: 'I owned the core implementation, made a clear trade-off, and can explain the result with a concrete metric.',
    nextAction: 'follow_up'
  };
}

function serveFile(req, res) {
  let p = req.url === '/' ? '/index.html' : req.url;
  p = decodeURIComponent(p.split('?')[0]);
  const file = path.resolve(PUBLIC_ROOT, `.${p}`);
  if (!file.startsWith(PUBLIC_ROOT + path.sep) && file !== PUBLIC_ROOT) {
    return sendJson(res, 403, { error: 'forbidden' });
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return sendJson(res, 404, { error: 'not found' });
  const ext = path.extname(file);
  const ct = ext === '.html' ? 'text/html; charset=utf-8'
    : ext === '.js' ? 'text/javascript; charset=utf-8'
    : ext === '.css' ? 'text/css; charset=utf-8'
    : ext === '.md' ? 'text/markdown; charset=utf-8'
    : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(file));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  loadEnv();
  const body = await parseBody(req);
  if (!hasUsableApiKey()) {
    return sendJson(res, 200, localInterviewReply(body));
  }

  try {
    const key = process.env.OPENAI_API_KEY;
    const { role = 'Software Engineer', userAnswer = '', question = '', interviewType = 'behavioral' } = body;
    const model = process.env.LLM_MODEL || 'gpt-5.4-mini';

    const typeContext = interviewType === 'resume_dive'
      ? 'Focus on the candidate\'s specific resume experience. Probe for concrete details, personal ownership, and measurable results.'
      : interviewType === 'case_study'
      ? 'You presented a business/product case scenario. Probe the candidate\'s structure, assumptions, and trade-off reasoning. Push for specificity.'
      : '';

    const prompt = `You are a realistic Hiring Manager conducting a ${role} interview.${typeContext ? ' ' + typeContext : ''}
Question just asked: ${question}
Candidate answer: ${userAnswer}

Decide the next step:
- follow_up: continue digging into the same topic
- next_question: move to a new question
- end_round: if answer quality is enough and session should end

Return strict JSON with keys:
followUp, recruiterLens, coachTip, polish, nextAction

Rules:
- followUp must be ONE concise spoken question or transition line.
- nextAction must be one of: follow_up, next_question, end_round.
- keep spoken followUp under 24 words.`;

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'interview_feedback',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                followUp: { type: 'string' },
                recruiterLens: { type: 'string' },
                coachTip: { type: 'string' },
                polish: { type: 'string' },
                nextAction: { type: 'string', enum: ['follow_up', 'next_question', 'end_round'] }
              },
              required: ['followUp', 'recruiterLens', 'coachTip', 'polish', 'nextAction'],
              additionalProperties: false
            }
          }
        }
      })
    });

    if (!r.ok) return sendJson(res, 500, { error: 'openai_error', detail: (await r.text()).slice(0, 1200) });
    const data = await r.json();
    let rawText = data && data.output_text ? data.output_text : '';
    if (!rawText && Array.isArray(data?.output)) {
      const chunks = [];
      for (const item of data.output) {
        if (!Array.isArray(item?.content)) continue;
        for (const c of item.content) {
          if (typeof c?.text === 'string') chunks.push(c.text);
        }
      }
      rawText = chunks.join('\n').trim();
    }
    // Fallback: extract first JSON object if model wrapped content with prose.
    if (rawText && (rawText[0] !== '{' || rawText[rawText.length - 1] !== '}')) {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) rawText = m[0];
    }
    const out = rawText ? JSON.parse(rawText) : null;
    if (!out) return sendJson(res, 500, { error: 'bad_response' });
    return sendJson(res, 200, out);
  } catch (e) {
    return sendJson(res, 500, { error: 'server_error', detail: String(e) });
  }
}

async function handleSTT(req, res) {
  loadEnv();
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes('your_openai_api_key_here')) {
    return sendJson(res, 400, { error: 'OPENAI_API_KEY missing in .env or OPENAI_CONFIG_TEMPLATE.txt' });
  }

  try {
    const { audioBase64 = '', mimeType = 'audio/webm' } = await parseBody(req);
    if (!audioBase64) return sendJson(res, 400, { error: 'missing_audio' });

    let base64Payload = audioBase64;
    const dataUrlMatch = /^data:(.*?);base64,(.*)$/.exec(audioBase64);
    let detectedMime = mimeType;
    if (dataUrlMatch) {
      detectedMime = dataUrlMatch[1] || mimeType;
      base64Payload = dataUrlMatch[2];
    }

    const binary = Buffer.from(base64Payload, 'base64');
    const extMap = {
      'audio/webm': 'webm',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'm4a'
    };
    const ext = extMap[detectedMime] || 'webm';
    const fileName = `speech.${ext}`;
    const sttModel = process.env.STT_MODEL || 'gpt-4o-mini-transcribe';

    const form = new FormData();
    form.append('model', sttModel);
    form.append('file', new Blob([binary], { type: detectedMime }), fileName);
    form.append('response_format', 'json');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}` },
      body: form
    });

    if (!r.ok) {
      return sendJson(res, 500, { error: 'stt_error', detail: (await r.text()).slice(0, 1200) });
    }

    const data = await r.json();
    const text = (data && data.text) ? data.text : '';
    return sendJson(res, 200, { text });
  } catch (e) {
    return sendJson(res, 500, { error: 'server_error', detail: String(e) });
  }
}

async function handleTTS(req, res) {
  loadEnv();
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes('your_openai_api_key_here')) {
    return sendJson(res, 400, { error: 'OPENAI_API_KEY missing in .env or OPENAI_CONFIG_TEMPLATE.txt' });
  }

  try {
    const { text = '' } = await parseBody(req);
    const ttsModel = process.env.TTS_MODEL || 'gpt-4o-mini-tts';
    const voice = process.env.TTS_VOICE || 'alloy';

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ttsModel, voice, input: text })
    });

    if (!r.ok) return sendJson(res, 500, { error: 'tts_error', detail: (await r.text()).slice(0, 1200) });
    const arr = Buffer.from(await r.arrayBuffer());
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': arr.length });
    res.end(arr);
  } catch (e) {
    return sendJson(res, 500, { error: 'server_error', detail: String(e) });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') return handleChat(req, res);
  if (req.method === 'POST' && req.url === '/api/stt') return handleSTT(req, res);
  if (req.method === 'POST' && req.url === '/api/tts') return handleTTS(req, res);
  return serveFile(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Demo server running: http://127.0.0.1:${PORT}`);
});
