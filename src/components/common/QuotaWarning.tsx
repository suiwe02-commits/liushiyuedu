import Modal from './Modal'

interface QuotaWarningProps {
  isOpen: boolean
  onClose: () => void
  quotaType: string
  used: number
  limit: number
  developerEmail?: string
  developerWechat?: string
}

export default function QuotaWarning({
  isOpen,
  onClose,
  quotaType,
  used,
  limit,
  developerEmail = 'developer@example.com',
  developerWechat = 'developer',
}: QuotaWarningProps) {
  const quotaNames: Record<string, string> = {
    max_articles: '文章数量',
    daily_api_calls: '每日API调用次数',
    storage_limit_mb: '存储空间',
  }

  const percentage = Math.min((used / limit) * 100, 100)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          您已达到免费使用上限
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-4">
          {quotaNames[quotaType] || quotaType}已达到 {used}/{limit}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
          <p className="text-sm text-gray-600 mb-2">
            如需继续使用，请联系开发者提升配额：
          </p>
          <div className="space-y-2">
            {developerEmail && (
              <p className="text-sm">
                <span className="font-medium text-gray-700">邮箱：</span>
                <a
                  href={`mailto:${developerEmail}`}
                  className="text-blue-600 hover:underline"
                >
                  {developerEmail}
                </a>
              </p>
            )}
            {developerWechat && (
              <p className="text-sm">
                <span className="font-medium text-gray-700">微信：</span>
                <span className="text-gray-900">{developerWechat}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            继续查看
          </button>
          <button
            onClick={() => {
              if (developerEmail) {
                window.location.href = `mailto:${developerEmail}?subject=请求提升配额`
              }
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            联系开发者
          </button>
        </div>
      </div>
    </Modal>
  )
}
