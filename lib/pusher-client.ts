import PusherClient from 'pusher-js'

export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_KEY || '6772718712a21e06c19f',
    {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        // Optional: Force TLS
        forceTLS: true,
    }
)
