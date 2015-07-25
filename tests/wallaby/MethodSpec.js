describe('Meteor methods', function () {
  describe('foo', function () {
    it('returns foo', function () {
      expect(Meteor.call('foo')).toBe('foo');
    })
  })
})
