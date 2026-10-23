// student-dashboard/src/lib/pushSound.js
// Plays the RCF notification sound when a push arrives while the app is
// open. The file is precached by the service worker, so it works offline
// and never shows up in the phone's Files or Music.
const SOUND_URL = '/RcfNotificationfx.wav'
let audio = null

function getAudio() {
  if (!audio) {
    audio = new Audio(SOUND_URL)
    audio.preload = 'auto'
    audio.volume = 0.8
  }
  return audio
}

export function playNotificationSound() {
  try {
    const a = getAudio()
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {
    // never let a sound problem affect the app
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'rcf-push-sound') playNotificationSound()
  })

  // Browsers only allow sound after a touch, so warm it up on the first one.
  const unlock = () => {
    const a = getAudio()
    a.muted = true
    a.play()
      .then(() => { a.pause(); a.currentTime = 0; a.muted = false })
      .catch(() => { a.muted = false })
  }
  window.addEventListener('pointerdown', unlock, { once: true })
}