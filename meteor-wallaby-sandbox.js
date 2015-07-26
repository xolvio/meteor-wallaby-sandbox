Articles = new Mongo.Collection('articles');

ArticlesService = {
  getArticles: function () {
    return Articles.find().fetch()
  }
}

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Articles.find().count() === 0) {
      Articles.insert({
        title: 'My first article',
        content: 'This is my first article.'
      });
    }
  });

  Meteor.methods({
    'getArticles': function () {
      return ArticlesService.getArticles();
    }
  })
}
