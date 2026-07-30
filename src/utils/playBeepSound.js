import { Audio } from 'expo-av'
import { Vibration } from 'react-native'

const BEEP_SOURCE = require('../../assets/scanner-beep.mp3')

let soundObject = null
let lastPlayed = 0

export async function playBeepSound() {
  const now = Date.now()
  if (now - lastPlayed < 500) return
  lastPlayed = now

  try {
    if (soundObject) {
      await soundObject.replayAsync()
      return
    }
    const { sound } = await Audio.Sound.createAsync(BEEP_SOURCE, { shouldPlay: true })
    soundObject = sound
  } catch (e) {
    console.log('Error playing beep sound:', e)
  }
}

export function triggerBeepAndVibrate() {
  Vibration.vibrate(100)
  playBeepSound()
}
