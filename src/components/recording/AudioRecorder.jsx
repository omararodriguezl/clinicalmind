import { useRef } from 'react'
import { Mic, Square, Pause, Play, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRecording } from '../../hooks/useRecording'

export function AudioRecorder({ onRecordingComplete, disabled }) {
  const {
    isRecording, isPaused, formattedDuration, audioBlob, audioUrl,
    error, startRecording, pauseRecording, resumeRecording,
    stopRecording, discardRecording,
  } = useRecording()

  const handleStop = () => {
    stopRecording()
    // audioBlob will be set after onstop fires — slight delay needed
    setTimeout(() => {
      // Notify parent via the hook's audioBlob state being set
    }, 100)
  }

  // Notify parent when audioBlob changes
  const prevBlobRef = useRef(null)
  if (audioBlob && audioBlob !== prevBlobRef.current) {
    prevBlobRef.current = audioBlob
    onRecordingComplete?.(audioBlob)
  }

  const handleDiscard = () => {
    discardRecording()
    onRecordingComplete?.(null)
    prevBlobRef.current = null
  }

  return (
    <div className="space-y-3">
      {/* Consent reminder */}
      <div className="flex items-start gap-2 p-2.5 rounded-md bg-warning-muted/30 border border-yellow-800/50">
        <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-yellow-300/80 leading-relaxed">
          Ensure you have obtained informed consent from your client before recording this session.
        </p>
      </div>

      {/* Recorder UI */}
      <div className="card-2 p-4">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex-shrink-0">
            {isRecording && !isPaused ? (
              <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-700 flex items-center justify-center">
                <div className="recording-dot" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-3 border border-border flex items-center justify-center">
                <Mic className={`w-4 h-4 ${isRecording ? 'text-yellow-400' : 'text-text-muted'}`} />
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex-1">
            <div className="font-mono text-xl font-semibold text-text-primary tabular-nums">
              {formattedDuration}
            </div>
            <div className="text-xs text-text-muted">
              {!isRecording && !audioBlob && 'Ready to record'}
              {isRecording && !isPaused && 'Recording...'}
              {isRecording && isPaused && 'Paused'}
              {!isRecording && audioBlob && 'Recording complete'}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {!isRecording && !audioBlob && (
              <Button
                variant="danger"
                size="sm"
                icon={Mic}
                onClick={startRecording}
                disabled={disabled}
                className="!bg-red-800 !border-red-700 !text-red-100 hover:!bg-red-700"
              >
                Record
              </Button>
            )}
            {isRecording && !isPaused && (
              <>
                <Button variant="secondary" size="icon" onClick={pauseRecording}>
                  <Pause className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Square}
                  onClick={stopRecording}
                  className="text-danger border-danger/30 hover:bg-danger-muted"
                >
                  Stop
                </Button>
              </>
            )}
            {isRecording && isPaused && (
              <>
                <Button variant="secondary" size="icon" onClick={resumeRecording}>
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Square}
                  onClick={stopRecording}
                  className="text-danger border-danger/30 hover:bg-danger-muted"
                >
                  Stop
                </Button>
              </>
            )}
            {!isRecording && audioBlob && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDiscard}
                className="text-text-muted hover:text-danger"
                title="Discard recording"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Audio playback */}
        {audioUrl && !isRecording && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted mb-1.5">Review recording before transcribing:</p>
            <audio controls src={audioUrl} className="w-full h-8" style={{ colorScheme: 'dark' }} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-danger-muted/30 border border-red-800">
          <AlertTriangle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  )
}
