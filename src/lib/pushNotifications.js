// RCFMOUAULIBRARYreact/student-dashboard/src/lib/pushNotifications.js
import { communityApi } from '../services/api'

// Set this to the VAPID PUBLIC key you generated (not the private one —
// this one is safe to ship in frontend code, same as any public key).
const VAPID_PUBLIC_KEY = 'BEuv_uWKRFcKOIkoNRtXzYaBTq-ZxSJ90ExQuKndhRcWTVchmaCIgxUiLv8w9VJ4pTKz5NklaZGuAueDISnWGuE'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

export async function getPushSubscriptionStatus() {
  if (!(await isPushSupported())) return 'unsupported'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return sub ? 'subscribed' : 'unsubscribed'
}

// The phone's own Allow / Block dialog. Must be called straight from a tap,
// with nothing awaited before it: phones (iPhones especially) and some
// browsers only show the dialog while the tap is "fresh", and silently
// ignore the request if anything was waited on first.
export function requestPhonePermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  if (Notification.permission !== 'default') return Promise.resolve(Notification.permission)
  try {
    // Older Safari only supports the callback form.
    return new Promise((resolve) => {
      const maybe = Notification.requestPermission(resolve)
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, () => resolve(Notification.permission))
    })
  } catch {
    return Promise.resolve(Notification.permission)
  }
}

export async function subscribeToPush() {
  if (!(await isPushSupported())) throw new Error('Push notifications are not supported on this device/browser.')

  const permission = Notification.permission === 'default' ? await requestPhonePermission() : Notification.permission
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  await communityApi.subscribePush(subscription.toJSON())
  return subscription
}

// Called from a tap. Brings up the phone's own Allow / Block notification
// dialog (no in-app popup). If the phone already allows notifications but this
// device isn't subscribed yet (new phone, cleared data), it subscribes quietly.
// Returns the permission that ends up set: 'granted' | 'denied' | 'default' | 'unsupported'.
export function askPhoneForPush() {
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return Promise.resolve('unsupported')
  }
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  // Ask first, synchronously inside the tap; subscribe afterwards.
  const asked = requestPhonePermission()
  return asked.then(async (permission) => {
    if (permission !== 'granted') return permission
    try {
      if ((await getPushSubscriptionStatus()) !== 'subscribed') await subscribeToPush()
      return 'granted'
    } catch {
      return Notification.permission
    }
  })
}

export async function unsubscribeFromPush() {
  if (!(await isPushSupported())) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await communityApi.unsubscribePush({ endpoint: sub.endpoint })
  await sub.unsubscribe()
}