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

export async function subscribeToPush() {
  if (!(await isPushSupported())) throw new Error('Push notifications are not supported on this device/browser.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  await communityApi.subscribePush(subscription.toJSON())
  return subscription
}

export async function unsubscribeFromPush() {
  if (!(await isPushSupported())) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await communityApi.unsubscribePush({ endpoint: sub.endpoint })
  await sub.unsubscribe()
}