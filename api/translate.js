// Vercel Serverless Function - 代理百度翻译大模型API
export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, from = 'en', to = 'zh', model_type = 'nmt' } = req.body

  if (!q) {
    return res.status(400).json({ error: 'Missing text to translate' })
  }

  const BAIDU_APP_ID = process.env.VITE_BAIDU_APP_ID
  const BAIDU_API_KEY = process.env.VITE_BAIDU_API_KEY

  if (!BAIDU_APP_ID || !BAIDU_API_KEY) {
    return res.status(500).json({ error: 'Baidu API credentials not configured' })
  }

  try {
    const response = await fetch('https://fanyi-api.baidu.com/ait/api/aiTextTranslate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAIDU_API_KEY}`,
      },
      body: JSON.stringify({
        appid: BAIDU_APP_ID,
        q,
        from,
        to,
        model_type, // 可选 'llm' 或 'nmt'
      }),
    })

    const data = await response.json()

    if (data.error_code) {
      return res.status(400).json({
        error: 'Baidu API error',
        error_code: data.error_code,
        error_msg: data.error_msg,
      })
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error('Translation error:', error)
    return res.status(500).json({ error: 'Translation failed', message: error.message })
  }
}
