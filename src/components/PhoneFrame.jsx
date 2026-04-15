import React, { useState, useEffect } from 'react'

export default function PhoneFrame({ children }) {
  const [currentTime, setCurrentTime] = useState(formatTime())

  function formatTime() {
    const now = new Date()
    let hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const period = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${minutes}`
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="phone-frame">
      <div className="phone-screen">
        <div className="dynamic-island" />
        <div className="status-bar">
          <span className="status-time">{currentTime}</span>
          <div className="status-icons">
            {/* Signal bars */}
            <svg className="signal-icon" width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="9" width="3" height="3" rx="0.5" fill="white" />
              <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="white" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" fill="white" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="white" />
            </svg>
            {/* WiFi */}
            <svg className="wifi-icon" width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 10.5C8.82843 10.5 9.5 11.1716 9.5 12C9.5 12.8284 8.82843 13.5 8 13.5C7.17157 13.5 6.5 12.8284 6.5 12C6.5 11.1716 7.17157 10.5 8 10.5Z" fill="white" transform="translate(0,-2)" />
              <path d="M4.93 8.47C5.86 7.54 7.12 6.98 8.5 6.98C9.88 6.98 11.14 7.54 12.07 8.47" stroke="white" strokeWidth="1.5" strokeLinecap="round" transform="translate(-0.5,-1)" />
              <path d="M2.1 5.64C3.73 4.01 5.98 3 8.5 3C11.02 3 13.27 4.01 14.9 5.64" stroke="white" strokeWidth="1.5" strokeLinecap="round" transform="translate(-0.5,-1)" />
              <path d="M0 2.82C2.17 0.65 5.17 -0.66 8.5 -0.66C11.83 -0.66 14.83 0.65 17 2.82" stroke="white" strokeWidth="1.5" strokeLinecap="round" transform="translate(-0.5,-1)" />
            </svg>
            {/* Battery */}
            <svg className="battery-icon" width="27" height="13" viewBox="0 0 27 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="rgba(255,255,255,0.35)" />
              <rect x="2" y="2" width="19" height="9" rx="2" fill="white" />
              <path d="M24 4.5V8.5C25.1046 8.5 26 7.60457 26 6.5C26 5.39543 25.1046 4.5 24 4.5Z" fill="rgba(255,255,255,0.35)" />
            </svg>
          </div>
        </div>
        <div className="phone-content">
          {children}
        </div>
        <div className="home-indicator" />
      </div>
    </div>
  )
}
