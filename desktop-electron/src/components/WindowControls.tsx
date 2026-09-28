export default function WindowControls() {
  if (!window.careConnectWindow) return null

  return (
    <div className="flex items-center gap-1 window-no-drag" aria-label="Window controls">
      <button className="window-control" type="button" aria-label="Minimize window" title="Minimize" onClick={() => window.careConnectWindow?.minimize()} />
      <button className="window-control" type="button" aria-label="Maximize or restore window" title="Maximize or restore" onClick={() => window.careConnectWindow?.maximize()} />
      <button className="window-control window-control-close" type="button" aria-label="Close window" title="Close" onClick={() => window.careConnectWindow?.close()} />
    </div>
  )
}
