import { TranslationResult } from '@/types'

// 使用 MyMemory Translation API (免费限制)
const MYMEMORY_API = 'https://api.mymemory.translated.net/get'

/**
 * 翻译文本
 * @param text 要翻译的文本
 * @param sourceLang 源语言 (默认: auto)
 * @param targetLang 目标语言 (默认: zh-CN)
 * @returns 翻译结果
 */
export const translateText = async (
  text: string,
  targetLang: string = 'zh-CN',
  sourceLang: string = 'en'
): Promise<TranslationResult | null> => {
  try {
    if (!text || text.trim().length === 0) {
      return null
    }

    // 使用 MyMemory 免费翻译API
    const langPair = sourceLang === 'auto' ? 'en' : sourceLang
    const response = await fetch(
      `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}|${targetLang}`
    )

    if (!response.ok) {
      console.error('Translation API error:', response.status)
      return null
    }

    const data = await response.json()

    if (data.responseStatus !== 200) {
      console.error('Translation API error:', data.responseDetails)
      return null
    }

    return {
      translatedText: data.responseData.translatedText,
      detectedLanguage: langPair === 'auto' ? data.responseData.detectedLanguage : undefined,
    }
  } catch (error) {
    console.error('Error translating text:', error)
    return null
  }
}

/**
 * 批量翻译段落
 * @param paragraphs 段落数组
 * @param targetLang 目标语言
 * @returns 翻译结果数组
 */
export const translateParagraphs = async (
  paragraphs: string[],
  targetLang: string = 'zh-CN'
): Promise<(TranslationResult | null)[]> => {
  // 逐段翻译，避免请求过大
  const results: (TranslationResult | null)[] = []
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) {
      results.push(null)
      continue
    }
    
    const result = await translateText(paragraph, targetLang)
    results.push(result)
    
    // 添加延迟避免频率限制
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return results
}
