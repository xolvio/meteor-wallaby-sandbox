describe('Meteor methods', function () {
  describe('getArticles', function () {
    it('returns articles', function () {
      var articles = Meteor.call('getArticles');
      expect(articles.length).toBe(1);
      var article = articles[0];
      expect(article.title).toBe('My first article');
      expect(article.content).toBe('This is my first article.');
    })
  })
})
