import { EventEmitter } from 'events'

// Global singleton for community events
class CommunityEventEmitter extends EventEmitter {}

// In development, we need to prevent multiple instances due to HMR
const globalForEvents = global as unknown as { communityEvents: CommunityEventEmitter }
export const communityEvents = globalForEvents.communityEvents || new CommunityEventEmitter()

if (process.env.NODE_ENV !== 'production') globalForEvents.communityEvents = communityEvents

export const COMMUNITY_EVENTS = {
    POST_UPDATED: 'POST_UPDATED',
    POST_CREATED: 'POST_CREATED',
    POST_DELETED: 'POST_DELETED',
    COMMENT_CREATED: 'COMMENT_CREATED',
    COMMENT_UPDATED: 'COMMENT_UPDATED',
}
