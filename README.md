# `plushie`

pusher-js wrapper to simplify auth, subscriptions, & events

`plushie` takes away some control to make most common use cases with `pusher-js` easier to manage:

- **Authentication:** Immediately connects to a `private-connections` channel to authenticate your session for use with `private-*` and `presence-*` channels
- **Subscriptions:** Subscribe and bind to events in the same step
- **Client events:** Trigger events that are passed through a pausable queue that keeps you under Pusher's rate limits.

## Installation

```bash
yarn add @replygirl/plushie
```

## Usage

### Initializing

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

```ts
const channel = plushie.subscribe('my-channel-name')
channel.bind({ 'my-event-name': data => console.info(data) })
channel.trigger([{ eventName: 'my-event-name', data: 'Hello world' }])
channel.unsubscribe()
```

### Working with the Plushie instance

```ts
plushie.subscribe('my-channel-name', {
  'my-event-name': data => console.info(data)
})
plushie.trigger([
  {
    channelName: 'my-channel-name',
    eventName: 'my-event-name',
    data: 'Hello world'
  }
])
channel.unsubscribe()
```

### Controlling the queue

```ts
plushie.triggerQueue.pause()
plushie.triggerQueue.play()
```

## License

[ISC (c) 2020 replygirl](https://github.com/replygirl/tc/blob/main/LICENSE.md)
