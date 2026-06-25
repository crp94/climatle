const https = require('https');
const { parse } = require('csv-parse');

https.get('https://www.qogdata.pol.gu.se/data/qog_ei_ts_sept21.csv', (res) => {
  let count = 0;
  res.pipe(parse({ columns: true })).on('data', (row) => {
    if (row.ccodealp === 'USA' && row.year > 2015) {
      console.log(row.year, 'EPI:', row.epi_cch, 'EF:', row.ef_efp);
    }
  }).on('end', () => console.log('Done'));
});
