'use strict'
var co = require('co')

var expect = require('chai').expect,
    LeBonCoin = require('../index'),
    subject = new LeBonCoin()

describe('#new', function() {
  it('initalizes max_price', function() {
    expect(subject.max_price).to.equal(400000)
  });
});

describe('#search_results', function() {
  it('gets results', function(done){
    this.timeout(40000);

    subject.get_results().
      then(function(status){
         expect(status).to.be.a('Array')
         console.log(status);
         done();
      }).
      catch(e => console.error('aye:' + e + '\n' + e.stack))
  });
});
