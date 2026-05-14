import { TranslationResult } from '@/types'

// 百度翻译大模型API配置
// 本地开发用 Vite 代理，生产环境用 Vercel API
const BAIDU_API_URL = import.meta.env.DEV 
  ? '/api/baidu-translate' 
  : '/api/translate'

/**
 * 调用百度翻译大模型API
 * 文档：https://fanyi-api.baidu.com/doc/21
 */
async function baiduTranslate(text: string, from: string = 'en', to: string = 'zh'): Promise<string | null> {
  try {
    const response = await fetch(BAIDU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        from,
        to,
      }),
    })

    if (!response.ok) {
      console.error('百度翻译API HTTP错误:', response.status)
      return null
    }

    const data = await response.json()

    if (data.error_code) {
      console.error('百度翻译API错误:', data.error_code, data.error_msg)
      return null
    }

    if (data.trans_result && data.trans_result.length > 0) {
      return data.trans_result.map((item: { dst: string }) => item.dst).join('\n')
    }

    return null
  } catch (error) {
    console.error('百度翻译请求失败:', error)
    return null
  }
}

/**
 * 翻译文本（百度翻译大模型API）
 */
export const translateText = async (
  text: string,
  targetLang: string = 'zh',
  sourceLang: string = 'en'
): Promise<TranslationResult | null> => {
  try {
    if (!text || text.trim().length === 0) {
      return null
    }

    const translatedText = await baiduTranslate(text, sourceLang, targetLang)

    if (translatedText) {
      return {
        translatedText,
        detectedLanguage: sourceLang,
      }
    }

    return null
  } catch (error) {
    console.error('Error translating text:', error)
    return null
  }
}

/**
 * 批量翻译段落
 */
export const translateParagraphs = async (
  paragraphs: string[],
  targetLang: string = 'zh'
): Promise<(TranslationResult | null)[]> => {
  const results: (TranslationResult | null)[] = []

  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      results.push(null)
      continue
    }

    const result = await translateText(paragraph, targetLang)
    results.push(result)

    // 添加延迟避免频率限制
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return results
}

/**
 * 查询单词翻译（供词典使用）
 */
export const translateWord = async (word: string): Promise<string | null> => {
  return baiduTranslate(word, 'en', 'zh')
}
