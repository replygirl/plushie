import { Data, WithChannelName } from './base'

export interface PlushieBindEventCallbackOptions<T = Data, U = any>
  extends WithChannelName {
  eventName: string
  callback: PlushieEventCallback<T, U>
}

export interface PlushieBindEventCallbacksOptions<T = Data, U = any>
  extends WithChannelName {
  eventCallbacks?: PlushieEventCallbacks<T, U>
}

export interface PlushieEventCallback<T = Data, U = any> {
  (data?: T): U | void
}

export interface PlushieEventCallbacks<T = Data, U = any> {
  [key: string]: PlushieEventCallback<T, U>
}

export interface PlushieEvent<T = Data> {
  eventName: string
  data: T
}

export interface PlushieEventScoped<T = Data>
  extends PlushieEvent<T>,
    WithChannelName {}

export interface PlushieEventQueueTriggerCallback<T = Data> {
  (event: PlushieEventScoped<T>): void
}
