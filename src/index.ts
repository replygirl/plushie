import Pusher from 'pusher-js'

export interface PlushieOptions {
  key: string
  authEndpoint?: string
  cluster?: string
}

export interface PlushieTrigger {
  eventName: string
  data: { [key: string]: any }
}

export interface PlushieTriggerScoped extends PlushieTrigger {
  channelName: string
}

export type PlushieEventCallback = (data?: any) => any | void
export type PlushieEventCallbacks = {
  [key: string]: PlushieEventCallback
}

export class Plushie {
  private _channels: { [key: string]: any } = {}
  private _pusher: Pusher
  private _triggerQueue: {
    interval?: number
    items: PlushieTriggerScoped[]
    play: () => void
    pause: () => void
    timeLastExecuted: number
  } = {
    items: [],
    play: () => {
      this._triggerQueue.interval = window.setInterval(() => {
        const {
          items: [x],
          timeLastExecuted: t
        } = this._triggerQueue
        if (
          !!x &&
          this._channels[x.channelName]?.isSubscribed &&
          Date.now().valueOf() - t > 100
        ) {
          const { channelName: c, eventName: e, data: d } =
            this._triggerQueue.items.shift() ?? {}
          if (c) this._channels[c].trigger(e, d)
          this._triggerQueue.timeLastExecuted = Date.now().valueOf()
        }
      }, 150)
    },
    pause: () => {
      window.clearInterval(this._triggerQueue.interval)
      delete this._triggerQueue.interval
    },
    timeLastExecuted: Date.now().valueOf()
  }

  constructor({ authEndpoint, cluster = 'us2', key }: PlushieOptions) {
    this._pusher = new Pusher(key, { authEndpoint, cluster })
    if (authEndpoint)
      this._pusher
        .subscribe('private-connections')
        .bind('pusher:subscription_error', (e: unknown) => {
          throw e
        })
    this._triggerQueue.play()
  }

  public subscribe(
    channelName: string,
    eventCallbacks: PlushieEventCallbacks
  ) {
    const bind = (eventName: string, callback: PlushieEventCallback) =>
      this._channels[channelName].bind(eventName, callback)

    if (!this._channels[channelName])
      this._channels[channelName] = this._pusher.subscribe(channelName)

    bind('pusher:subscription_succeeded', () => {
      this._channels[channelName].isSubscribed = true
    })

    const bindEventCallbacks = (
      eventCallbacks: PlushieEventCallbacks
    ) =>
      Object.entries(eventCallbacks).forEach(([e, cb]) => bind(e, cb))

    if (!this._channels[channelName]?.isSubscribed)
      bind('pusher:subscription_succeeded', () =>
        bindEventCallbacks(eventCallbacks)
      )
    else bindEventCallbacks(eventCallbacks)

    return {
      bind: (eventCallbacks: PlushieEventCallbacks) =>
        bindEventCallbacks(eventCallbacks),
      trigger: (trigger: PlushieTrigger) =>
        this.trigger({
          channelName: this._channels[channelName],
          ...trigger
        }),
      unsubscribe: () => this.unsubscribe(channelName)
    }
  }

  public unsubscribe(channelName: string) {
    this._channels[channelName].unbind()
    this._pusher.unsubscribe(channelName)
  }

  public unsubscribeAll() {
    Object.keys(this._channels).forEach(x => this.unsubscribe(x))
  }

  public trigger(...triggers: PlushieTriggerScoped[]) {
    triggers.forEach(x => this._triggerQueue.items.push(x))
  }

  public get triggerQueue() {
    return {
      pause: () => this._triggerQueue.pause(),
      play: () => this._triggerQueue.play()
    }
  }
}

export default Plushie
