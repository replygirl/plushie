import Pusher from 'pusher-js'

import { Data, WithChannelName } from './models/base'
import {
  PlushieBindEventCallbackOptions,
  PlushieBindEventCallbacksOptions,
  PlushieEvent,
  PlushieEventCallbacks,
  PlushieEventQueueTriggerCallback,
  PlushieEventScoped,
} from './models/event'

export * from './models/base'
export * from './models/event'

export interface PlushieChannelOptions<T = Data, U = any>
  extends PlushieBindEventCallbacksOptions<T, U> {
  plushie: Plushie<T, U>
}

export interface PlushieEventQueueOptions<T = Data, U = any> {
  plushie: Plushie<T, U>
  triggerCallback: PlushieEventQueueTriggerCallback<T>
}

export interface PlushieOptions {
  key: string
  authEndpoint?: string
  cluster?: string
}

export class PlushieChannel<T = Data, U = any> {
  private _channelName: string
  private _plushie: Plushie<T, U>

  constructor({
    channelName,
    eventCallbacks,
    plushie
  }: PlushieChannelOptions<T, U>) {
    this._channelName = channelName
    this._plushie = plushie

    if (!plushie.subscriptions.includes(channelName))
      plushie.subscribe({ channelName, eventCallbacks })
  }

  public get name() {
    return this._channelName
  }
  public get plushie() {
    return this._plushie
  }

  public bind(eventCallbacks: PlushieEventCallbacks<T, U>) {
    this.plushie.bindEventCallbacks({
      channelName: this.name,
      eventCallbacks
    })
  }

  public trigger(event: PlushieEvent<T>) {
    this.plushie.trigger([{ channelName: this.name, ...event }])
  }

  public unsubscribe() {
    this.plushie.unsubscribe({ channelName: this.name })
  }
}

export class PlushieEventQueue<T = Data, U = any> {
  private _interval?: number
  private _items: PlushieEventScoped<T>[] = []
  private _plushie: Plushie<T, U>
  private _timeLastExecuted: number
  private _trigger: PlushieEventQueueTriggerCallback<T>

  constructor({
    plushie,
    triggerCallback
  }: PlushieEventQueueOptions<T, U>) {
    this._plushie = plushie
    this._timeLastExecuted = Date.now().valueOf()
    this._trigger = triggerCallback
  }

  public get plushie() {
    return this._plushie
  }

  public add(event: PlushieEventScoped<T>) {
    this._items.push(event)
  }

  public pause() {
    window.clearInterval(this._interval)
    delete this._interval
  }

  public play() {
    this._interval = window.setInterval(
      () => this._triggerNext(),
      150
    )
  }

  private _reducer(
    acc: PlushieEventScoped<T> | null,
    { channelName: c }: PlushieEventScoped<T>,
    i: number
  ): PlushieEventScoped<T> | null {
    return !acc && this._plushie.subscriptions.includes(c)
      ? this._items.splice(i)[0]
      : acc
  }

  private _triggerNext() {
    if (Date.now().valueOf() - this._timeLastExecuted > 100) {
      const event = this._items.reduce(this._reducer, null)
      if (!!event) {
        this._trigger(event)
        this._timeLastExecuted = Date.now().valueOf()
      }
    }
  }
}

export class Plushie<T = Data, U = any> {
  private _channels: { [key: string]: any } = {}
  private _pusher: Pusher
  private _eventQueue: PlushieEventQueue<
    T,
    U
  > = new PlushieEventQueue<T, U>({
    plushie: this,
    triggerCallback: ({
      channelName: c,
      eventName: e,
      data: d
    }: PlushieEventScoped<T>) => this._channels[c].bind(e, d)
  })

  constructor({
    authEndpoint,
    cluster = 'us2',
    key
  }: PlushieOptions) {
    this._pusher = new Pusher(key, {
      authEndpoint,
      cluster
    })
    if (authEndpoint)
      this._pusher
        .subscribe('private-connections')
        .bind('pusher:subscription_error', (e: unknown) => {
          throw e
        })
    this._eventQueue.play()
  }

  public get eventQueue() {
    return {
      pause: () => this._eventQueue.pause(),
      play: () => this._eventQueue.play()
    }
  }

  public get subscriptions() {
    return Object.keys(this._channels)
  }

  public bindEventCallback({
    channelName: c,
    eventName: e,
    callback: cb
  }: PlushieBindEventCallbackOptions<T, U>) {
    this._channels[c].bind(e, cb)
  }

  public bindEventCallbacks({
    channelName,
    eventCallbacks: cbs = {}
  }: PlushieBindEventCallbacksOptions<T, U>) {
    Object.entries(cbs).forEach(([eventName, callback]) =>
      this.bindEventCallback({
        channelName,
        eventName,
        callback
      })
    )
  }

  public subscribe({
    channelName,
    eventCallbacks
  }: PlushieBindEventCallbacksOptions<T, U>) {
    this._subscribe({ channelName, eventCallbacks })
    return new PlushieChannel<T, U>({
      channelName,
      plushie: this
    })
  }

  public trigger(events: PlushieEventScoped<T>[]) {
    events
      .filter(
        ({ channelName: c, eventName: e, data: d }) =>
          !!c && !!e && !!d
      )
      .forEach(x => this._eventQueue.add(x))
  }

  public unsubscribe({ channelName: c }: WithChannelName) {
    this._channels[c].unbind()
    this._pusher.unsubscribe(c)
  }

  public unsubscribeAll() {
    this.subscriptions.forEach(channelName =>
      this.unsubscribe({ channelName })
    )
  }

  private _subscribe({
    channelName,
    eventCallbacks
  }: PlushieBindEventCallbacksOptions<T, U>) {
    if (!this._channels[channelName])
      this._channels[channelName] = this._pusher.subscribe(
        channelName
      )

    if (!this._channels[channelName]?.isSubscribed)
      this.bindEventCallback({
        channelName,
        eventName: 'pusher:subscription_succeeded',
        callback: () => {
          this._channels[channelName].isSubscribed = true
          this.bindEventCallbacks({
            channelName,
            eventCallbacks
          })
        }
      })
    else
      this.bindEventCallbacks({
        channelName,
        eventCallbacks
      })
  }
}

export default Plushie
