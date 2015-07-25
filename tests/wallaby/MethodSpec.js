describe('Meteor methods', function () {
  describe('foo', function () {
    it('returns foo', function (done) {
      expect(Meteor.call('foo')).toBe('foo');
    })
  })
})
