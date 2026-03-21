import type { ChatMessage as ChatMessageType } from '../../store/useMulakatStore'

interface Props {
  message: ChatMessageType
  d: boolean
}

export function ChatMessage({ message, d }: Props) {
  const isInterviewer = message.role === 'interviewer'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isInterviewer ? 'flex-start' : 'flex-end',
        marginBottom: '12px',
      }}
    >
      {isInterviewer && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
            marginRight: '10px',
            marginTop: '2px',
          }}
        >
          🎤
        </div>
      )}
      <div
        style={{
          maxWidth: '72%',
          padding: '12px 16px',
          borderRadius: isInterviewer ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
          background: isInterviewer
            ? d
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(0,0,0,0.05)'
            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: isInterviewer
            ? d
              ? 'rgba(226,232,240,0.9)'
              : '#1e293b'
            : '#ffffff',
          fontSize: '14px',
          lineHeight: 1.65,
          boxShadow: isInterviewer
            ? d
              ? '0 2px 8px rgba(0,0,0,0.2)'
              : '0 2px 8px rgba(0,0,0,0.07)'
            : '0 4px 12px rgba(99,102,241,0.35)',
        }}
      >
        {message.content}
      </div>
      {!isInterviewer && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            flexShrink: 0,
            marginLeft: '10px',
            marginTop: '2px',
          }}
        >
          👤
        </div>
      )}
    </div>
  )
}
