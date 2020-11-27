# `plushie`

pusher-js wrapper to simplify auth, subscriptions, & events

![node-current (scoped)](https://img.shields.io/node/v/@replygirl/plushie) ![GitHub top language](https://img.shields.io/github/languages/top/replygirl/plushie) [![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/@replygirl/plushie)](https://libraries.io/npm/@replygirl%2Fplushie) [![Maintainability](https://api.codeclimate.com/v1/badges/1a438989c970847d85fd/maintainability)](https://codeclimate.com/github/replygirl/plushie/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/1a438989c970847d85fd/test_coverage)](https://codeclimate.com/github/replygirl/plushie/test_coverage) [![GitHub issues](https://img.shields.io/github/issues/replygirl/plushie)](https://github.com/replygirl/plushie/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr/replygirl/plushie)](https://github.com/replygirl/plushie/pulls)

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

// Create a Plushie
const plushie = new Plushie({
  // REQUIRED: Your app's public key
  key: 'myKey',

  // OPTIONAL:
  // - Required for private & presence channels
  // - Required to trigger events
  authEndpoint: '/my-auth-endpoint'
})

// Bind to events on a channel
const channel = plushie.subscribe({
  channelName: 'my-channel-name',
  bindings: [
    {
      eventName: 'my-event-name',
      callback: data => console.info(data)
    }
  ]
})

// Add more event bindings later
channel.bind([
  {
    eventName: 'my-other-event-name',
    callback: data => console.info(data)
  }
])

// Trigger a client event
channel.trigger([
  {
    eventName: 'my-event-name',
    data: 'Hello world'
  }
])

// Let it go
channel.unsubscribe()
```

### Controlling the queue

Your `Plushie`'s event queue will automatically start & stop as you subscribe & unsubscribe, but you can intervene too:

```js
// Stop triggering events
plushie.eventQueue.pause()

// Resume triggering events
plushie.eventQueue.play()
```

### Tearing down

```js
plushie.unsubscribeAll()
```

### Advanced features

This doc keeps it simple, but a lot of Plushie's internal logic is exposed to give you more options. Explore the definition files or [source code](https://github.com/replygirl/tc/blob/main/src/index.ts) to figure out some neat tricks.

## New in v2.x

- The event queue will only run when you're subscribed to a channel
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
