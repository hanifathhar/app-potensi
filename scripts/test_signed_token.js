const jwt = require('jsonwebtoken');
const { connectBastion } = require('./remote_exec');

const keys = {
  "key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAgIiFFtQW0P2bvB3YYyBunVNxtVET7aqeVSKu0Y7I7Q92WuUz\n7xVbaD4aJLFNADgUbqTcphccRTHhl5XWFq1RhyyoHYjL22ItPuq35nRmhouZ1NBJ\nAQDEjww2Q/y1B+PahCn/Q7UyofJqZz/GnkCeDdRXgFh8dNayY0RSgC41X6tAx0Sl\nq9wjoXRVvOK2gsCw18CkzSQtvZUNM0x2N6z42iO0CEIfyEon+WXnFCmc6n91ai7Z\njNj14kp6FTxG2iZ0pvFT1S6V6A0MDWmFurb7105I4774kqJGobJOk32k263R5c6Q\n9Abkx0vaE929cewhjSqofauro5raoTaa2+CNYwIDAQABAoIBAEHrwrZumDUfnNvi\nQrS0UYcG4O6pYpsmQoZPf3Gi1ZIfuAfuPbCFN5hDIY1oEaHnITOOAkx81db3OkhQ\nZLjEs2esk5xyKHuf4qy+HQto75xZxM/M82Q8TJNBJCPCW+ZsCgp2r6C+MfW1KrVB\nlFBdu7JEEYyV1V7nLh6TT+zFxkIGCYoloBcqp3RvlIM3/gzUlltHsBljIDwC5VpC\nmLlVXlk5rtk4EZfmNOh8+tXJLC383jIv0aveFX+r+xL7xNlTymFnAVlyuUAt5OUY\nYDxZUQ56+iTfDr+LS12yhmyD35tDfEO5ShAg3AKn92K1RNa5OIWpFCQimhblCH8b\nSIMB3CECgYEA20j5jR/oVqrawohSak6hQVnqY0eSHxbljKXKNN5fG9YzA1i8rlhh\nDa+eDarhrRmKrr62VUlwJ/Lu1tEj1nYfk4H9mm3hXfvqbKkaWmaoF3Nl5TECr0uJ\nIdtN8P91ArvM0yVdNHVzOaMtxk+RevmJj6vbYrJGNLl98FN+AW+iMqcCgYEAlg26\n+ll7G4pNllo3Bk9WtK3lR7KyEF0eUxb3+yB4bQFR54gTsddPtCXgzjWcnYksAh1l\nS0uq18MM1WOqlRfUCPvfzzaWSL9jYjml7KAOqw5cZYb6aGyGR1h1dKXWo4hSJZnc\npYJNQxsRyL2mxomVDn3jn/442KqRqbdQxsSqkuUCgYBA1Acq6Kb4kFRSNJkg4pQb\nzOhVZ4BUfqFofk8UaDV39lBoieBmLqyqriOs6LsFQMrWNH2VIzvsI47mpTfSHGPj\naQe/kwKQlXxNmYS3+ydwn2YdZurjRhKJltspB2zhXQIF3kL60ko5XPuYaEebMpCv\nj+AxAoFs7vXDiftzkzxBewKBgAWeYf/51chEN3+HxUOxONfvIwS6Rjyin/4QgByh\nLKE4SW7YA5THMS7XtEFEdKbZehJiM2bMYItPvG1JHBwVFlV3yPujWaFDuV72NaZU\nn/f7w63xjfLXDXgicdN6Wj0pX5oU1tRDuszmeJYBs/r/L9upDxrwlARY7rdiK94l\ngxWZAoGBAKjkQx7dUSlt3LoHONJw6wOytpFkm/dfDkfkslfn5riI0JXVqn0Q56Wz\nyUldFTR5X91VTxQkJsirloPSlx5E6xqxWmWYip0buPByXi7WyyyL/OjrFHHdAxDt\nzPZFFG8puHW2/nQW4my0Wn503K0enOvMqppAGkAMQdSkCC8qeIcf\n-----END RSA PRIVATE KEY-----"
};

const token = jwt.sign(
  {
    iss: 'api',
    attrs: { id: 1 },
    scope: ['user']
  },
  keys.key,
  {
    algorithm: 'RS256',
    expiresIn: '2h'
  }
);

console.log('Generated JWT Token length:', token.length);

async function main() {
  const bastion = await connectBastion();
  console.log('Connected to bastion');

  const cmd = `curl -s -X GET http://192.168.1.106:81/api/nginx/proxy-hosts -H "Content-Type: application/json" -H "Authorization: Bearer ${token}"`;
  
  bastion.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', code => {
      try {
        const json = JSON.parse(out);
        if (Array.isArray(json)) {
          console.log(`SUCCESS! Found ${json.length} proxy hosts:`);
          for (const h of json) {
            console.log(` - ID ${h.id}: ${h.domain_names.join(', ')} -> ${h.forward_host}:${h.forward_port} (Certificate: ${h.certificate_id})`);
          }
        } else {
          console.log('Response:', json);
        }
      } catch (e) {
        console.log('Raw output:', out);
      }
      bastion.end();
    });
  });
}

main().catch(console.error);
