const express = require('express');
const app = express();

app.set('port', (process.env.PORT || 5000));

app.get('/', (req, res) => {
        res.send('Hello');
    }
)

app.listen(app.get('port'), () => console.log('App is listening to ' + app.get('port')));