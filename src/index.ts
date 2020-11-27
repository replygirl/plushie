import Pusher from 'pusher-js'

import { Data, WithChannelName } from './models/base'
import {
  PlushieBindEventCallbacksOptions,
  PlushieEvent,
  PlushieEventBinding,
  PlushieEventBindingScoped,
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
    bindings,
    plushie
  }: PlushieChannelOptions<T, U>) {
    this._channelName = channelName
    this._plushie = plushie

    if (!plushie.subscriptions.includes(channelName))
      plushie.subscribe({ channelName, bindings })
  }

  public get name() {
    return this._channelName
  }
  public get plushie() {
    return this._plushie
  }

  public bind(bindings: PlushieEventBinding<T, U>[]) {
    this.plushie.bind(
      bindings.map(x => ({ ...x, channelName: this.name }))
    )
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

  public bind(bindings: PlushieEventBindingScoped<T, U>[]) {
    bindings.forEach(
      ({ callback: cb, channelName: c, eventName: e }) =>
        this._channels[c].bind(e, cb)
    )
  }

  public subscribe({
    channelName,
    bindings
  }: PlushieBindEventCallbacksOptions<T, U>) {
    this._subscribe({ channelName, bindings })
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
    bindings
  }: PlushieBindEventCallbacksOptions<T, U>) {
    const bindingsScoped =
      bindings?.map(x => ({ ...x, channelName })) ?? []
    if (!this._channels[channelName])
      this._channels[channelName] = this._pusher.subscribe(
        channelName
      )

    if (!this._channels[channelName]?.isSubscribed)
      this.bind([
        {
          channelName,
          eventName: 'pusher:subscription_succeeded',
          callback: () => {
            this._channels[channelName].isSubscribed = true
            this.bind(bindingsScoped)
          }
        }
      ])
    else this.bind(bindingsScoped)
  }
}

export default Plushie
