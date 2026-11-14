// RCFMOUAULIBRARYreact/student-dashboard/src/components/ui/BroPaulButton.jsx
// The floating "Chat with Bro Paul" button: a green WhatsApp circle with a
// little bot badge that opens a WhatsApp chat with the number Bro Paul is
// linked to right now (GET /bro-paul).
//   - Drag it anywhere; let go and it glides to the nearest side.
//   - Left alone for a few seconds it tucks half off-screen to give the page
//     room; tap it once to bring it out, again to open the chat.
//   - Now and then (and when someone first opens the app) it says something
//     in a speech bubble: "Hey there, I'm Bro Paul 👋", "Need to chat?"…
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { communityApi } from '../../services/api'

const SIZE = 60
const EDGE = 14
const TOP_CLEARANCE = 84
const BOTTOM_CLEARANCE = 100
const TUCK_AFTER_MS = 8000
const BUBBLE_MS = 6000
const POS_KEY = 'rcf_bropaul_pos'
const CONTACT_KEY = 'rcf_bropaul_contact'
const GREETED_KEY = 'rcf_bropaul_greeted'
const HIDDEN = [/^\/signin/, /^\/splash/, /^\/complete-profile/, /^\/onboarding/, /^\/resources\/[^/]+\/read/, /^\/admin/]

const LINES = [
  'Chat with Bro Paul on WhatsApp 💬',
  "Hey there, I'm Bro Paul 👋 Let's chat!",
  'Need a past question? Ask Bro Paul 📚',
  'Need to chat? I’m right here 😊',
  'Can’t find a book? Message me 🔎',
  'Need lecture notes? I can help ✍️',
  'Got a question? Ask Bro Paul 🙋🏾‍♂️',
]

const read = (key, fallback, store = localStorage) => {
  try {
    const v = store.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const write = (key, value, store = localStorage) => {
  try { store.setItem(key, JSON.stringify(value)) } catch { /* storage blocked */ }
}

const clampY = (y) => Math.min(Math.max(y, TOP_CLEARANCE), Math.max(window.innerHeight - SIZE - BOTTOM_CLEARANCE, TOP_CLEARANCE))

function WhatsAppGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.78h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zm8.41-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.42z"
      />
    </svg>
  )
}

function BroPaulButton() {
  const { pathname } = useLocation()
  const [contact, setContact] = useState(() => read(CONTACT_KEY, null, sessionStorage))
  const [pos, setPos] = useState(() => {
    const saved = read(POS_KEY, null)
    return saved && (saved.side === 'left' || saved.side === 'right') && Number.isFinite(saved.y)
      ? saved
      : { side: 'right', y: window.innerHeight * 0.56 } // above the study button
  })
  const [drag, setDrag] = useState(null)
  const [tucked, setTucked] = useState(false)
  const [bubble, setBubble] = useState(null) // { text, key, typing }
  const [, setViewport] = useState(0)
  const gesture = useRef(null)
  const tuckTimer = useRef(0)
  const [firstLine] = useState(() => Math.floor(Math.random() * LINES.length))
  const lineIndex = useRef(firstLine)

  const hidden = HIDDEN.some((re) => re.test(pathname))

  // Fetch the number once per session.
  useEffect(() => {
    if (contact) return undefined
    let cancelled = false
    communityApi
      .broPaul()
      .then((res) => {
        if (cancelled || !res?.phone) return
        setContact(res)
        write(CONTACT_KEY, res, sessionStorage)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [contact])

  useEffect(() => {
    const onResize = () => setViewport((v) => v + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Any interaction pops it out; quiet for a while tucks it away.
  const wake = useCallback(() => {
    setTucked(false)
    clearTimeout(tuckTimer.current)
    tuckTimer.current = setTimeout(() => setTucked(true), TUCK_AFTER_MS)
  }, [])

  const say = useCallback((text) => {
    const key = Date.now()
    wake()
    setBubble({ text, key, typing: true })
    setTimeout(() => setBubble((b) => (b?.key === key ? { ...b, typing: false } : b)), 900)
    setTimeout(() => setBubble((b) => (b?.key === key ? null : b)), BUBBLE_MS)
    clearTimeout(tuckTimer.current)
    tuckTimer.current = setTimeout(() => setTucked(true), BUBBLE_MS + TUCK_AFTER_MS / 2)
  }, [wake])

  // Greeting on entering the app, then a line now and then.
  useEffect(() => {
    if (!contact || hidden) return undefined
    const timers = []
    if (!read(GREETED_KEY, false, sessionStorage)) {
      write(GREETED_KEY, true, sessionStorage)
      const firstEver = !read(GREETED_KEY, false)
      write(GREETED_KEY, true)
      timers.push(setTimeout(() => say(firstEver ? LINES[1] : LINES[0]), 3500))
    } else {
      timers.push(setTimeout(() => setTucked(true), TUCK_AFTER_MS))
    }
    let next
    const schedule = () => {
      next = setTimeout(() => {
        if (!document.hidden && !document.querySelector('[role="dialog"], [role="alertdialog"]')) {
          lineIndex.current = (lineIndex.current + 1) % LINES.length
          say(LINES[lineIndex.current])
        }
        schedule()
      }, 75000 + Math.random() * 75000)
    }
    schedule()
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(next)
    }
  }, [contact, hidden, say])

  useEffect(() => () => clearTimeout(tuckTimer.current), [])

  const openChat = () => {
    if (!contact?.phone) return
    const text = encodeURIComponent("Hi Bro Paul 👋 I'm coming from the RCF library app.")
    window.open(`https://wa.me/${contact.phone}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const onPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    gesture.current = { startX: e.clientX, startY: e.clientY, offX: e.clientX - rect.left, offY: e.clientY - rect.top, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    clearTimeout(tuckTimer.current)
  }
  const onPointerMove = (e) => {
    const g = gesture.current
    if (!g) return
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < 6) return
    g.moved = true
    setBubble(null)
    setTucked(false)
    setDrag({
      x: Math.min(Math.max(e.clientX - g.offX, 0), window.innerWidth - SIZE),
      y: Math.min(Math.max(e.clientY - g.offY, 0), window.innerHeight - SIZE),
    })
  }
  const onPointerUp = (e) => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (!g.moved) {
      // Tucked: the first tap brings it out (with a line), the next opens the chat.
      if (tucked) say(LINES[0])
      else openChat()
      return
    }
    const centerX = e.clientX - g.offX + SIZE / 2
    const next = { side: centerX < window.innerWidth / 2 ? 'left' : 'right', y: clampY(e.clientY - g.offY) }
    setPos(next)
    setDrag(null)
    write(POS_KEY, next)
    wake()
  }
  const onPointerCancel = () => {
    gesture.current = null
    setDrag(null)
  }

  if (!contact?.phone || hidden) return null

  const w = window.innerWidth
  const restX = pos.side === 'left' ? (tucked ? -SIZE / 2 : EDGE) : tucked ? w - SIZE / 2 : w - SIZE - EDGE
  const x = drag ? drag.x : restX
  const y = drag ? drag.y : clampY(pos.y)
  const bubbleOnLeft = (drag ? drag.x + SIZE / 2 > w / 2 : pos.side === 'right')

  return (
    <div
      className="fixed z-[45] touch-none select-none"
      style={{
        left: x,
        top: y,
        width: SIZE,
        height: SIZE,
        transition: drag ? 'none' : 'left 0.5s cubic-bezier(0.3, 1.25, 0.5, 1), top 0.45s cubic-bezier(0.3, 1.25, 0.5, 1), opacity 0.3s',
        opacity: tucked ? 0.9 : 1,
      }}
    >
      {bubble && (
        <button
          type="button"
          onClick={openChat}
          className={`rcf-bp-bubble absolute top-1/2 -translate-y-1/2 ${bubbleOnLeft ? 'right-[calc(100%+12px)] origin-right' : 'left-[calc(100%+12px)] origin-left'} w-max max-w-[230px] text-left rounded-2xl bg-white text-[#0b3d2c] shadow-[0_10px_30px_rgba(0,0,0,0.3)] px-3.5 py-2.5 font-label-md text-label-md font-semibold`}
        >
          {bubble.typing ? (
            <span className="flex items-center gap-1 py-1" aria-label="Bro Paul is typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="rcf-bp-dot w-1.5 h-1.5 rounded-full bg-[#25D366]" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          ) : (
            <span key={bubble.key} className="rcf-bp-text block">{bubble.text}</span>
          )}
          {/* tail pointing at the button */}
          <span className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rotate-45 ${bubbleOnLeft ? '-right-1.5' : '-left-1.5'}`} aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        aria-label="Chat with Bro Paul on WhatsApp"
        title="Chat with Bro Paul on WhatsApp"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={`relative w-full h-full rounded-full ${drag ? 'scale-110' : ''} transition-transform`}
      >
        <span className="rcf-bp-ring pointer-events-none absolute inset-0 rounded-full bg-[#25D366]" aria-hidden="true" />
        <span className="pointer-events-none relative w-full h-full rounded-full bg-gradient-to-br from-[#3ee07a] to-[#11a14f] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(17,161,79,0.45)] border border-white/25">
          <WhatsAppGlyph className="w-[30px] h-[30px]" />
        </span>
        {/* bot badge */}
        <span className="pointer-events-none absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-[#11a14f] flex items-center justify-center shadow ring-2 ring-[#11a14f]/20">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
        </span>
        {contact.online && <span className="pointer-events-none absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-lime-300 ring-2 ring-[#11a14f]" aria-hidden="true" />}
      </button>
    </div>
  )
}

export default BroPaulButton
