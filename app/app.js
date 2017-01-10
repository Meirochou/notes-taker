var express = require('express'),
    app = express(),
    reload = require('reload'),
    path = require('path')


app.set('port', process.env.PORT || 4096)
app.set('view engine', 'ejs')
app.set('views', 'app/views')

app.use('/static', express.static(path.join(__dirname, "static")))
app.use("/", require(path.join(__dirname, "routes/index")))
app.use("/notes", require(path.join(__dirname, "routes/notes")))

var server = app.listen(app.get("port"), function() {
    console.log("Listening on port " + app.get("port"))
})

reload(server, app)
