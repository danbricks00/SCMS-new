/**
 * Vercel serverless: proxies HTML → PDF via API2PDF (key stays on the server).
 * Set API2PDF_API_KEY in Vercel → Project → Settings → Environment Variables.
 *
 * Matches official client: POST /chrome/pdf/html, Authorization: <api key>
 * @see https://github.com/Api2Pdf/api2pdf.node/blob/master/src/Api2Pdf.js
 */
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.API2PDF_API_KEY;
  if (!apiKey || apiKey === 'your_api2pdf_key') {
    res.status(503).json({
      error: 'PDF service not configured',
      hint: 'Add API2PDF_API_KEY in Vercel project settings',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  const html = body && typeof body.html === 'string' ? body.html : '';
  if (!html.trim()) {
    res.status(400).json({ error: 'Missing html' });
    return;
  }

  try {
    const upstream = await fetch('https://v2.api2pdf.com/chrome/pdf/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        html,
        inline: true,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      res.status(502).json({
        error: 'API2PDF request failed',
        status: upstream.status,
        details: data,
      });
      return;
    }

    if (data.Success === false && data.Error) {
      res.status(502).json({ error: data.Error, details: data });
      return;
    }

    const fileUrl =
      data.FileUrl ||
      data.fileUrl ||
      data.pdf ||
      data.Pdf ||
      data.url ||
      (typeof data.file === 'string' ? data.file : null);

    if (!fileUrl) {
      res.status(502).json({
        error: 'Unexpected API2PDF response',
        details: data,
      });
      return;
    }

    res.status(200).json({ fileUrl, FileUrl: fileUrl });
  } catch (e) {
    console.error('[pdf-from-html]', e);
    res.status(500).json({ error: 'PDF generation failed', message: String(e && e.message) });
  }
};
