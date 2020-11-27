import { Data, WithChannelName, WithEventName } from './base'

export interface PlushieBindEventCallbacksOptions<T = Data, U = any>
  extends WithChannelName {
  bindings?: PlushieEventBinding<T, U>[]
}

export interface PlushieEventCallback<T = Data, U = any> {
  (data?: T): U | void
}

export interface PlushieEventBinding<T = Data, U = any>
  extends WithEventName {
  callback: PlushieEventCallback<T, U>
}

export interface PlushieEventBindingScoped<T = Data, U = any>
  extends PlushieEventBinding<T, U>,
    WithChannelName {}

export interface PlushieEvent<T = Data> extends WithEventName {
  data: T
}

export interface PlushieEventScoped<T = Data>
  extends PlushieEvent<T>,
    WithChannelName {}

export interface PlushieEventQueueTriggerCallback<T = Data> {
  (event: PlushieEventScoped<T>): void
}
