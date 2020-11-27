# `plushie`

pusher-js wrapper to simplify auth, subscriptions, & events

`plushie` makes working with Pusher channels easy:

- **Authentication:** Immediately connects to a `private-connections` channel to authenticate your session for use with `private-*` and `presence-*` channels
- **Subscriptions:** Subscribe and bind to events in the same step
- **Client events:** Trigger events that are passed through a pausable queue that keeps you under Pusher's rate limits.

## Installation

```bash
yarn add @replygirl/plushie
```

## Usage

```ts
import Plushie from '@replygirl/plushie'

// Without authentication
const plushie = new Plushie({ key: 'myKey' })

// With authentication
const plushieWithAuth = new Plushie({
  key: 'myKey',
  authEndpoint: '/my-auth-endpoint'
})
```

### Working with channels

```js
const channel = plushie.subscribe({
  channelName: 'my-channel-name',
  bindings: [
    {
      eventName: 'my-event-name',
      callback: data => console.info(data)
    }
  ]
})

channel.trigger([
  { eventName: 'my-event-name', data: 'Hello world' }
])

channel.unsubscribe()
```

### Working with the Plushie instance

```js
plushie.subscribe({ channelName: 'my-channel-name' })

plushie.bind([
  {
    channelName: 'my-channel-name',
    eventName: 'my-event-name',
    callback: data => console.info(data)
  }
])

plushie.trigger([
  {
    channelName: 'my-channel-name',
    eventName: 'my-event-name',
    data: 'Hello world'
  }
])

plushie.unsubscribe('my-channel-name')
// or plushie.unsubscribeAll()
```

### Controlling the queue

```js
plushie.triggerQueue.pause()
plushie.triggerQueue.play()
```

## New in v2.x

- THe event queue will only run when you're subscribed to a channel
- Full typing
  - Channels are now `PlushieChannel`s
  - Event bindings are now `PlushieEventBinding`s
  - Events are now `PlushieEvent`s
- Generics: `new Plushie<T, U>`
  - `T` is the base type of your event data
  - `U` is the base return type of your event callbacks
- Bind an array of events with `Plushie.bind`
- Get the name of a channel with `PlushieChannel.name`
- Get the Plushie instance a channel belongs to with `PlushieChannel.plushie`

### Migrating from v1.x

Unless you were using undocumented capabilities, the only breaking change is how you use `Plushie.subscribe`:

```js
// Before
plushie.subscribe('my-channel-name', {
  'my-event-name': data => console.info(data)
})

// After
plushie.subscribe({
  channelName: 'my-channel-name',
  bindings: [
    {
      eventName: 'my-event-name',
      callback: data => console.info(data)
    }
  ]
})
```

## License

[ISC (c) 2020 replygirl](https://github.com/replygirl/tc/blob/main/LICENSE.md)
