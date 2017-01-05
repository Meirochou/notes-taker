var express = require ("express"),
    router = express.Router(),
    reloadScript = '<script src="/reload/reload.js"></script>'

router.get("/", function(req, res) {
    res.send("index home" + reloadScript)
})

module.exports = router


