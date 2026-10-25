const jwt = require('jsonwebtoken');
const { connectBastion } = require('./remote_exec');

const keys = {
  key: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAgIiFFtQW0P2bvB3YYyBunVNxtVET7aqeVSKu0Y7I7Q92WuUz
7xVbaD4aJLFNADgUbqTcphccRTHhl5XWFq1RhyyoHYjL22ItPuq35nRmhouZ1NBJ
AQDEjww2Q/y1B+PahCn/Q7UyofJqZz/GnkCeDdRXgFh8dNayY0RSgC41X6tAx0Sl
q9wjoXRVvOK2gsCw18CkzSQtvZUNM0x2N6z42iO0CEIfyEon+WXnFCmc6n91ai7Z
jNj14kp6FTxG2iZ0pvFT1S6V6A0MDWmFurb7105I4774kqJGobJOk32k263R5c6Q
9Abkx0vaE929cewhjSqofauro5raoTaa2+CNYwIDAQABAoIBAEHrwrZumDUfnNvi
QrS0UYcG4O6pYpsmQoZPf3Gi1ZIfuAfuPbCFN5hDIY1oEaHnITOOAkx81db3OkhQ
ZLjEs2esk5xyKHuf4qy+HQto75xZxM/M82Q8TJNBJCPCW+ZsCgp2r6C+MfW1KrVB
lFBdu7JEEYyV1V7nLh6TT+zFxkIGCYoloBcqp3RvlIM3/gzUlltHsBljIDwC5VpC
mLlVXlk5rtk4EZfmNOh8+tXJLC383jIv0aveFX+r+xL7xNlTymFnAVlyuUAt5OUY
YDxZUQ56+iTfDr+LS12yhmyD35tDfEO5ShAg3AKn92K1RNa5OIWpFCQimhblCH8b
SIMB3CECgYEA20j5jR/oVqrawohSak6hQVnqY0eSHxbljKXKNN5fG9YzA1i8rlhh
Da+eDarhrRmKrr62VUlwJ/Lu1tEj1nYfk4H9mm3hXfvqbKkaWmaoF3Nl5TECr0uJ
IdtN8P91ArvM0yVdNHVzOaMtxk+RevmJj6vbYrJGNLl98FN+AW+iMqcCgYEAlg26
+ll7G4pNllo3Bk9WtK3lR7KyEF0eUxb3+yB4bQFR54gTsddPtCXgzjWcnYksAh1l
S0uq18MM1WOqlRfUCPvfzzaWSL9jYjml7KAOqw5cZYb6aGyGR1h1dKXWo4hSJZnc
pYJNQxsRyL2mxomVDn3jn/442KqRqbdQxsSqkuUCgYBA1Acq6Kb4kFRSNJkg4pQb
zOhVZ4BUfqFofk8UaDV39lBoieBmLqyqriOs6LsFQMrWNH2VIzvsI47mpTfSHGPj
aQe/kwKQlXxNmYS3+ydwn2YdZurjRhKJltspB2zhXQIF3kL60ko5XPuYaEebMpCv
j+AxAoFs7vXDiftzkzxBewKBgAWeYf/51chEN3+HxUOxONfvIwS6Rjyin/4QgByh
LKE4SW7YA5THMS7XtEFEdKbZehJiM2bMYItPvG1JHBwVFlV3yPujWaFDuV72NaZU
n/f7w63xjfLXDXgicdN6Wj0pX5oU1tRDuszmeJYBs/r/L9upDxrwlARY7rdiK94l
gxWZAoGBAKjkQx7dUSlt3LoHONJw6wOytpFkm/dfDkfkslfn5riI0JXVqn0Q56Wz
yUldFTR5X91VTxQkJsirloPSlx5E6xqxWmWYip0buPByXi7WyyyL/OjrFHHdAxDt
zPZFFG8puHW2/nQW4my0Wn503K0enOvMqppAGkAMQdSkCC8qeIcf
-----END RSA PRIVATE KEY-----`
};

const token = jwt.sign(
  { iss: 'api', attrs: { id: 1 }, scope: ['user'] },
  keys.key,
  { algorithm: 'RS256', expiresIn: '2h' }
);

async function checkNPM() {
  const bastion = await connectBastion();
  bastion.exec(`curl -s -X GET "http://192.168.1.106:81/api/nginx/certificates/44" -H "Authorization: Bearer ${token}"`, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Cert 44 in NPM:', out);
      bastion.end();
    });
  });
}

checkNPM().catch(console.error);
