const { inputParser } = require('./util');

test('URL is www.ingemark.com', ()=> {
    const text = inputParser('multiple levels[ [www.first.com[www.first.com]] www.google.com www.ingemark.com] asfsfas');
    expect(text).toBe('www.ingemark.com');
})

test('URL is https://www.google.com/', ()=> {
    const text = inputParser('multiple levels [ [www.first.com[www.first.com]] www.ingemark.com https://www.google.com/] sgsgsg');
    expect(text).toBe('https://www.google.com/');
})

test('No brackets', ()=> {
    const text = inputParser('multiple levels www.ingemark.com sgsgsg');
    expect(text).toBe('www.google.com');
})
