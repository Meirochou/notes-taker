var express = require('express'),
    app = express(),
    router = express.Router(),
    https = require('https'),
    md = require('markdown-it')({html: true}),
    url = require('url'),
    reloadScript = '<script src="/reload/reload.js"></script>',
    owner = 'zhongweizhao',
    repo = 'github-api-test',
    uwAPIKey = '5edb44d933a5d6262bc77b8375ae0a3d'

function getNotesList(callback){
    var options = {
        host: 'api.github.com',
        path: '/repos/' + owner + '/' + repo + '/contents/',
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    }

    var body = ''
    var request = https.request(options, function(response){
        console.log('statusCode:', response.statusCode)
        console.log('' + response.headers['content-type'])

        response.on('data', function(d){
            body += d.toString('utf8')
        })

        response.on('end', function(){
            console.log('Close reveived!\n')
            callback(body)
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()
}


function getNoteOfACourse(courseCode, callback) {

    function downloadNotes(noteFilesList, callback, md) {

        if (md === undefined) {
            md = ""
        }

        if (noteFilesList.length == 0){
            console.log('|Finished downloading all notes.\n')
            callback(md)
        } else {
            /* get the first note and */
            var options = {
                host: 'raw.githubusercontent.com',
                path: url.parse(noteFilesList[0].download_url).pathname,
                method: 'GET',
                headers: {'user-agent': 'node.js'}
            }

            console.log('|\tDownloading from ' + options.path)

            var request = https.request(options, function(response){
                console.log('|\tstatusCode:', response.statusCode)
                console.log('|\t' + response.headers['content-type'])

                response.on('data', function(d){
                    md += '<!--' + options.host + options.path + '-->\n'
                    md += d.toString('utf8')
                })

                response.on('end', function(){
                    console.log('|\tReveived!')

                    /* get the rest notes */
                    downloadNotes(noteFilesList.slice(1), callback, md)
                })
            })

            request.on('error', function(e){
                console.log('problem with request: ' + e.message)
            })

            request.end()


        }
    }


    var options = {
        host: 'api.github.com',
        path: '/repos/' + owner + '/' + repo + '/contents/' + courseCode,
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    }

    var body = ''
    var request = https.request(options, function(response){
        console.log('statusCode:', response.statusCode)
        console.log(response.headers['content-type'])

        response.on('data', function(d){
            body += d.toString('utf8')
        })

        response.on('end', function(){
            console.log('Close reveived!\n')
            noteFilesList = JSON.parse(body)
            if (response.statusCode == 200){
                console.log('|Start download notes.\n')
                downloadNotes(noteFilesList, callback)
            } else {
                var console_message = 'Fail to find notes\n'
                console.log(console_message)
                var message = '`Fail to fetch notes`'
                callback(message)
            }
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()

}


function getCourseDescription(subject, catalog_number, callback) {
    var options = {
        host: 'api.uwaterloo.ca',
        path: '/v2/courses/' + subject + '/' + catalog_number + '.json?key=' + uwAPIKey,
        method: 'GET',
        headers: {'user-agent': 'node.js'}
    }

    var body = ''
    var request = https.request(options, function(response){
        console.log('Fetch course title: ')
        console.log('|\tstatusCode:', response.statusCode)
        console.log('|\t' + response.headers['content-type'])

        response.on('data', function(d){
            body += d.toString('utf8')
        })

        response.on('end', function(){
            console.log('|\tReveived!')
            if (response.statusCode == 200){
                console.log('|\tRequest success')
                data = JSON.parse(body)
                if (data.meta.status == 200) {
                    console.log('|\tCourse title get')
                    description = data.data.title
                    callback(description)
                } else {
                    console.log('|\tCourse title failed to get')
                    callback('Failed to get course title')
                }
            } else {
                console.log('|\tRequest failed')
            }
        })
    })

    request.on('error', function(e){
        console.log('problem with request: ' + e.message)
    })

    request.end()
}


function escapeLaTeX(input) {
    function escapeChar(c) {
        switch (c) {
            case '&': return '&amp;'
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '"': return '&quot;'
            case "\\": return '&#92;'
            case "'": return '&#39;'
            default: return c
        }
    }

    function scanner(input, bool) {
        if (input.length == 0) {
            return input
        } else {
            c = input.substr(0,2)
            if (c.substr(0,1) == "$") {
                return "$" + escapeChar(c.substr(1,1))  + scanner(input.slice(2), !bool)
            } else if (bool) {
                return escapeChar(c.substr(0,1)) + scanner(input.slice(1), bool)
            } else {
                return c.substr(0,1) + scanner(input.slice(1), bool)
            }
        }
    }

    return scanner(input, false)
}



router.get('/', function(req, res){
    function callback(notesListData) {
        var info = ''
        notesListData = JSON.parse(notesListData)

        res.render('notes/index', {
            notesListData: notesListData
        })
    }

    getNotesList(callback)

})

router.get(/(\w+[0-9]\w*)/, function(req, res){
    console.log('\n--------------------------------')
    function callback(data) {
        markdown = md.render(escapeLaTeX(data)) + reloadScript
        subject =  req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$1').toUpperCase()
        catalog_number = req.params[0].replace(/(([A-Z]|[a-z])+)(\d+(([A-Z]|[a-z])+)*)$/g, '$3').toUpperCase()
        title = subject + ' ' + catalog_number

        function callback(description) {
            res.render('notes/detail', {
                markdown: markdown,
                Title: title,
                description: description
            })
        }

        getCourseDescription(subject, catalog_number, callback)

    }

    getNoteOfACourse(req.params[0], callback)
})

module.exports = router



