const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const ROOT = __dirname;

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
    if (!process.env[k]) process.env[k] = v;
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

function serveFile(req, res) {
  let p = req.url === '/' ? '/index.html' : req.url;
  p = decodeURIComponent(p.split('?')[0]);
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) return sendJson(res, 403, { error: 'forbidden' });
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
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes('your_openai_api_key_here')) {
    return sendJson(res, 400, { error: 'OPENAI_API_KEY missing in .env or OPENAI_CONFIG_TEMPLATE.txt' });
  }

  try {
    const { role = 'Software Engineer', userAnswer = '', question = '' } = await parseBody(req);
    const model = process.env.LLM_MODEL || 'gpt-5.4-mini';
    const prompt = `You are a realistic interviewer for role ${role}.
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
    const out = data.output_text ? JSON.parse(data.output_text) : null;
    if (!out) return sendJson(res, 500, { error: 'bad_response' });
    return sendJson(res, 200, out);
  } catch (e) {
    return sendJson(res, 500, { error: 'server_error', detail: String(e) });
  }
}

async function handleSTT(req, res) {
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
