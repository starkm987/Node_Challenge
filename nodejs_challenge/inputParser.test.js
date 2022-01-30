const { inputParser } = require('./app');

test('URL is www.ingemark.com', ()=> {
    const text = inputParser('multiple levels[ [www.first.com[www.first.com]] www.zetcode.com/javascript/axios www.google.com www.ingemark.com] ');
    expect(text).toBe('www.ingemark.com');
})


