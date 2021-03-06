'use strict'

var co = require('co');
var Nightmare = require('nightmare');
var extend = require('util')._extend;

var default_params = {
  'max_price': 400000,
  'min_rooms': 3,
  'min_area': 55,
  'locations': ['75013', '75020'],
  'show': false
};

function LeBonCoin(args){

  args = extend(default_params, (args||{}));
  this.nightmare = Nightmare({show: args['show'] });

  this.max_price = args['max_price'];
  this.min_rooms = args['min_rooms'];
  this.min_area = args['min_area'];
  this.locations = args['locations'];

  return this;
}


LeBonCoin.prototype.set_locations = function*(locations){
  for (let location of locations){
    yield this.nightmare.type('[name = location_p]', location)
      .wait(4000)
      .click('ul.location-list li:nth-child(2)')
  }
};

LeBonCoin.prototype.set_max = function*(field, max_value){
  var self = this;
  yield self.nightmare
    .evaluate(function (field, max_value) {
      let select = $(`option:contains('${field}')`).parent();
      var res = {'id': select.attr('id')};
      select.find('option').each(function(){
        let value = parseInt(this.text.replace(/\s/g, ''));
        if(value >= max_value){
          res ['value']= this.value;
          return false;
        }
      });
      return res;
    }, field, max_value).
    then(function(res){
      self.nightmare.select('#' + res['id'], res['value'])
    })
}

LeBonCoin.prototype.get_announce = function*(){
  res = [];
  var self = this;
  yield self.nightmare
    .evaluate(function () {
      var results = [];
      $(".tabsContent li").each(function(){
        let $this = $(this);
        let picture_url = $this.find('span.item_imagePic span').attr('data-imgsrc');
        if (picture_url !== undefined) {
          picture_url = window.location.protocol + picture_url;
        }
        let publication_date = $this.find('aside').text().trim();
        publication_date = new Date(publication_date);
        publication_date.setFullYear(2016);
        results.push(
          {
            title:    $this.find('h2.item_title').text().trim(),
            price:    parseInt($this.find('h3.item_price').text().replace(/[\n\s€]/g,'')),
            url:      window.location.protocol + $this.find('a').attr('href'),
            picture:  picture_url,
            publication_date: publication_date
          }
        );
      });
      return results;
    }).then(function(results){
      res = results;
    });
    return res;
};

LeBonCoin.prototype.setup_search = function*(){
  yield this.nightmare
    .goto('https://www.leboncoin.fr/ventes_immobilieres/offres/ile_de_france/?th=1')
    .click('span[data-toggleclass="searchbar-open"]');

  yield this.set_max('Surface min', 50);
  yield this.set_max('Prix max', 450000);
  yield this.set_max('Pièces min', 3);
  yield this.set_locations(['75013', '75020'])

  yield this.nightmare.click('#searchbutton')
                 .wait('#main');
  return this
};

LeBonCoin.prototype.get_announces = function*(){
  var self = this;
  let results = yield self.get_announce();

  while( yield self.nightmare.exists('#next:not(.disabled)')){
    yield self.nightmare.click('#next').wait('#main');
    results.concat(yield self.get_announce());
  }
  yield self.nightmare.end();
  return results;
};

function res(result) {
  return result;
}


LeBonCoin.prototype.get_results = function (){
  var self = this;
  return co(function*(){
    yield self.setup_search();
    return yield self.get_announces();
  })
};

module.exports = LeBonCoin;
