import assert from 'assert'

const eq = (a: any, b: any) => () => assert.deepStrictEqual(a, b)

describe('plushie', async () => {
  it('needs unit tests', eq((() => true)(), true))
})
