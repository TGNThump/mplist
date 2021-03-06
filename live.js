const request = require('request');
const cheerio = require('cheerio')
const mps = require('./mps.js');

var xSecond = 10000; // 10 second
var time = new Date();

time.setMinutes( time.getMinutes() - 10 );

var id;

request('http://data.parliamentlive.tv/api/event/feed', function(error, response, body){
  if (error || response.statusCode != 200){
    console.log(error);
    return;
  }

  if (!body) return;
  const $ = cheerio.load(body);

  id = $('title').filter(function(i, el) {
    return $(this).text() === 'House of Commons';
  }).siblings('id').first().text();

  poll();
  setInterval(poll,xSecond);
});


function poll(){
 request('https://parliamentlive.tv/Event/EventLogsBetween/' + id + '?startTime=' + time.toISOString(), function (error, response, body) {
   if (!error && response.statusCode == 200) {
    if (!body) return;
    const $ = cheerio.load(body);
    time = new Date($('.time-code').attr('data-time'));
    
    let stack = [];

    $('.stack-item h4').each(function(i, elem) {
      let line = $(this).text().trim();
      stack.push(line);
    });

    while (stack.length > 0){
      let line = stack.pop();
      ["Rt Hon", "Sir", "Mrs", "Mr", "Dr", "Ms", "Dame"].forEach(title => {
        if (line.startsWith(title + " ")) line = line.substring((title + " ").length);
      })

      if (line.includes(",")) line = line.substring(0, line.indexOf(",")).trim();
      if (line.includes("(")) line = line.substring(0, line.indexOf("(")).trim();

      if (line.endsWith("MP")) line = line.substring(0, line.length-2).trim();
      if (line.endsWith("QC")) line = line.substring(0, line.length-2).trim();

      if (line == "Speaker") line = Object.values(mps).filter(mp => mp.party.toLowerCase().includes(line.toLowerCase()));
      else results = Object.values(mps).filter(mp => mp.displayAs.toLowerCase().includes(line.toLowerCase()));
      
      if (results.length == 1) results[0].print();
      else console.log(line); 
    } 
   } else console.log(error);

 });
}