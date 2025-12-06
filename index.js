/*  EXPRESS SETUP  */
const express = require('express');
const app = express();

app.use(express.static(__dirname));

const bodyParser = require('body-parser');
const expressSession = require('express-session')({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 60000
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));

/*  PASSPORT SETUP  */

const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

/* MONGOOSE SETUP */
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/MyDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const UserDetail = new Schema({
    username: String
});

UserDetail.plugin(passportLocalMongoose);

const UserDetails = mongoose.model('userInfo', UserDetail);

passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());


/* REGISTER USERS ONCE */

const usersToRegister = [
    { username: 'paul', password: 'paul' },
    { username: 'joy',  password: 'joy'  },
    { username: 'ray',  password: 'ray'  }
];

usersToRegister.forEach(({ username, password }) => {
    UserDetails.findOne({ username }).then(user => {
        if (!user) {
            UserDetails.register({ username }, password)
                .then(() => console.log(`Registered ${username}`))
                .catch(err => console.log(err));
        } else {
            console.log(`${username} already exists`);
        }
    });
});


/*  ROUTES  */

const connectEnsureLogin = require('connect-ensure-login');

app.post('/login', 
  passport.authenticate('local', { 
    successReturnToOrRedirect: '/',
    failureRedirect: '/login?info=Invalid credentials' 
  })
);


app.get('/login',
    (req, res) => res.sendFile('html/login.html', { root: __dirname })
);

app.get('/',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile('html/index.html', { root: __dirname })
);

app.get('/private',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile('html/private.html', { root: __dirname })
);

app.get('/user',
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.send({ user: req.user })
);

app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.sendFile('html/logout.html', { root: __dirname });
    });
});


// /* REGISTER SOME USERS */

// UserDetails.register({ username: 'paul', active: false }, 'paul');
// UserDetails.register({ username: 'joy', active: false }, 'joy');
// UserDetails.register({ username: 'ray', active: false }, 'ray');
